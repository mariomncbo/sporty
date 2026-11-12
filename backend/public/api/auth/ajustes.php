<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
require_once("../../../src/lib/depurar.php");
require_once("../../../src/lib/subir_imagen.php");
session_start();

$respuesta = ['success' => false, 'errores' => [], 'usuario' => null];

if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = "Sesión no iniciada";
    echo json_encode($respuesta);
    exit;
}

// Obtener datos actuales del usuario
try {
    $stmt = $_conexion->prepare(
        "SELECT id_usuario, name, nickname, foto_perfil, bio, website, genero, cuenta_privada
         FROM usuarios WHERE nickname = :nickname LIMIT 1"
    );
    $stmt->bindValue(':nickname', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmt->execute();
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(401);
        $respuesta['errores']['auth'] = "Usuario no encontrado";
        echo json_encode($respuesta);
        exit;
    }
    $id_usuario = (int) $usuario['id_usuario'];
} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema";
    echo json_encode($respuesta);
    exit;
}

// ── GET — Devolver datos del perfil ──────────────────────────────────────────
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $respuesta['success'] = true;
    $respuesta['usuario'] = [
        'name'           => $usuario['name'],
        'nickname'       => $usuario['nickname'],
        'foto_perfil'    => $usuario['foto_perfil'],
        'bio'            => $usuario['bio'],
        'website'        => $usuario['website'],
        'genero'         => $usuario['genero'],
        'cuenta_privada' => (int) $usuario['cuenta_privada'],
    ];
    echo json_encode($respuesta);
    exit;
}

// ── POST — Guardar cambios ────────────────────────────────────────────────────
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $updates = [];
    $params  = [];
    $errores = false;

    // ── Eliminar foto ─────────────────────────────────────────────────────────
    if (!empty($_POST['eliminar_foto'])) {
        if (!empty($usuario['foto_perfil'])) {
            $filePath = dirname(__DIR__, 3) . '/' . $usuario['foto_perfil'];
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }
        $updates[] = "foto_perfil = NULL";
    }

    // ── Subir foto nueva ──────────────────────────────────────────────────────
    if (
        !empty($_FILES['foto']) &&
        isset($_FILES['foto']['error']) &&
        $_FILES['foto']['error'] === UPLOAD_ERR_OK
    ) {
        try {
            // Eliminar foto anterior si existe
            if (!empty($usuario['foto_perfil'])) {
                $oldFile = dirname(__DIR__, 3) . '/' . $usuario['foto_perfil'];
                if (file_exists($oldFile)) {
                    @unlink($oldFile);
                }
            }

            // subirImagen devuelve 'uploads/avatars/filename.jpg'
            $rutaRelativa = subirImagen($_FILES['foto'], 'avatars');
            $fotoPath     = '/backend/public/' . $rutaRelativa;
            $updates[]    = "foto_perfil = :foto_perfil";
            $params[':foto_perfil'] = $fotoPath;
        } catch (RuntimeException $e) {
            $respuesta['errores']['foto'] = $e->getMessage();
            $errores = true;
        }
    }

    // ── Bio ──────
    if (isset($_POST['bio'])) {
        $bio = depurar($_POST['bio']);
        if (mb_strlen($bio) > 150) {
            $respuesta['errores']['bio'] = "La bio no puede superar 150 caracteres.";
            $errores = true;
        } else {
            $updates[] = "bio = :bio";
            $params[':bio'] = $bio === '' ? null : $bio;
        }
    }

    // ── Website ──
    if (isset($_POST['website'])) {
        $website = trim($_POST['website']);
        if ($website !== '' && !filter_var($website, FILTER_VALIDATE_URL)) {
            $respuesta['errores']['website'] = "URL no válida.";
            $errores = true;
        } else {
            $updates[] = "website = :website";
            $params[':website'] = $website === '' ? null : $website;
        }
    }

    // ── Cuenta privada ───
    if (isset($_POST['cuenta_privada'])) {
        $nuevaPrivada = (int) $_POST['cuenta_privada'] === 1 ? 1 : 0;
        $updates[] = "cuenta_privada = :cuenta_privada";
        $params[':cuenta_privada'] = $nuevaPrivada;

        // Si cambia de privada a pública → aceptar solicitudes pendientes automáticamente
        if ($nuevaPrivada === 0 && (int) $usuario['cuenta_privada'] === 1) {
            try {
                $_conexion->prepare(
                    "UPDATE seguidores SET estado = 'aceptado' WHERE id_seguido = :id AND estado = 'pendiente'"
                )->execute([':id' => $id_usuario]);

                // Notificar a los recién aceptados
                $stmtPend = $_conexion->prepare(
                    "SELECT id_seguidor FROM seguidores WHERE id_seguido = :id AND estado = 'aceptado'"
                );
                $stmtPend->execute([':id' => $id_usuario]);
                $aceptados = $stmtPend->fetchAll(PDO::FETCH_COLUMN);
                $stmtNotif = $_conexion->prepare(
                    "INSERT IGNORE INTO notificaciones (id_destinatario, id_emisor, tipo) VALUES (:dest, :emisor, 'nuevo_seguidor')"
                );
                foreach ($aceptados as $idSeg) {
                    $stmtNotif->execute([':dest' => (int)$idSeg, ':emisor' => $id_usuario]);
                }
            } catch (PDOException $e) { /* No crítico */ }
        }
    }

    // ── Género ───
    $generosPermitidos = ['hombre', 'mujer', 'personalizado', 'prefiero_no_decirlo'];
    if (isset($_POST['genero']) && $_POST['genero'] !== '') {
        if (!in_array($_POST['genero'], $generosPermitidos, true)) {
            $respuesta['errores']['genero'] = "Género no válido.";
            $errores = true;
        } else {
            $updates[] = "genero = :genero";
            $params[':genero'] = $_POST['genero'];
        }
    }

    if (!$errores) {
        if (!empty($updates)) {
            try {
                $sql = "UPDATE usuarios SET " . implode(', ', $updates) . " WHERE id_usuario = :id_usuario";
                $params[':id_usuario'] = $id_usuario;
                $stmt = $_conexion->prepare($sql);
                $stmt->execute($params);
            } catch (PDOException $e) {
                http_response_code(500);
                $respuesta['errores']['general'] = "Error del sistema";
                echo json_encode($respuesta);
                exit;
            }
        }

        $respuesta['success'] = true;

        // Devolver la nueva foto si cambió
        if (isset($fotoPath)) {
            $respuesta['foto_perfil'] = $fotoPath;
        } elseif (!empty($_POST['eliminar_foto'])) {
            $respuesta['foto_perfil'] = null;
        }
    }

    echo json_encode($respuesta);
    exit;
}

http_response_code(405);
$respuesta['errores']['metodo'] = "Método no permitido";
echo json_encode($respuesta);
exit;
?>
