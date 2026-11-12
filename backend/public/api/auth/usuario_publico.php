<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
session_start();

$respuesta = ['success' => false, 'errores' => []];

if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = "Sesión no iniciada";
    echo json_encode($respuesta);
    exit;
}

$method = $_SERVER["REQUEST_METHOD"];

// Obtener id del usuario en sesión
try {
    $stmtMe = $_conexion->prepare(
        "SELECT id_usuario, name, nickname, foto_perfil FROM usuarios WHERE nickname = :nick LIMIT 1"
    );
    $stmtMe->bindValue(':nick', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmtMe->execute();
    $me = $stmtMe->fetch(PDO::FETCH_ASSOC);

    if (!$me) {
        http_response_code(401);
        $respuesta['errores']['auth'] = "Usuario de sesión no encontrado";
        echo json_encode($respuesta);
        exit;
    }
    $id_yo = (int) $me['id_usuario'];
} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema";
    echo json_encode($respuesta);
    exit;
}

// ── GET — Datos del perfil público ──────────────────────────────────────────
if ($method === "GET") {
    $targetNick = isset($_GET['user']) ? trim($_GET['user']) : '';

    if ($targetNick === '') {
        http_response_code(400);
        $respuesta['errores']['user'] = "Parámetro user requerido";
        echo json_encode($respuesta);
        exit;
    }

    // Si el usuario busca su propio perfil, redirigir
    if ($targetNick === $_SESSION["nickname"]) {
        $respuesta['success']      = true;
        $respuesta['es_propio']    = true;
        $respuesta['yo']           = $me;
        echo json_encode($respuesta);
        exit;
    }

    try {
        $stmt = $_conexion->prepare("
            SELECT
                u.id_usuario,
                u.name,
                u.nickname,
                u.foto_perfil,
                u.verificado,
                u.entrenador,
                u.bio,
                u.website,
                u.cuenta_privada,
                (SELECT COUNT(*) FROM seguidores WHERE id_seguido  = u.id_usuario AND estado = 'aceptado') AS total_seguidores,
                (SELECT COUNT(*) FROM seguidores WHERE id_seguidor = u.id_usuario AND estado = 'aceptado') AS total_seguidos,
                (SELECT COUNT(*) FROM posts      WHERE id_autor    = u.id_usuario) AS total_posts,
                (SELECT COUNT(*) FROM seguidores WHERE id_seguidor = :id_yo  AND id_seguido = u.id_usuario AND estado = 'aceptado') AS yo_le_sigo,
                (SELECT COUNT(*) FROM seguidores WHERE id_seguidor = :id_yo2 AND id_seguido = u.id_usuario AND estado = 'pendiente') AS solicitud_pendiente
            FROM usuarios u
            WHERE u.nickname = :nick AND u.baneado = 0
            LIMIT 1
        ");
        $stmt->bindValue(':nick',   $targetNick, PDO::PARAM_STR);
        $stmt->bindValue(':id_yo',  $id_yo,      PDO::PARAM_INT);
        $stmt->bindValue(':id_yo2', $id_yo,      PDO::PARAM_INT);
        $stmt->execute();
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$usuario) {
            http_response_code(404);
            $respuesta['errores']['usuario'] = "Usuario no encontrado";
            echo json_encode($respuesta);
            exit;
        }

        $id_target = (int) $usuario['id_usuario'];
        $cuentaPrivada     = (int) $usuario['cuenta_privada'];
        $yoLeSigo          = (int) $usuario['yo_le_sigo'];
        $solicitudPendiente = (int) $usuario['solicitud_pendiente'];
        $mostrarContenido  = !$cuentaPrivada || $yoLeSigo;

        $posts    = [];
        $rutinas  = [];
        $historias = [];

        if ($mostrarContenido) {
            // Posts con imagen
            $stmtPosts = $_conexion->prepare(
                "SELECT id_post, imagen, contenido, fecha
                 FROM posts WHERE id_autor = :id AND imagen IS NOT NULL
                 ORDER BY fecha DESC"
            );
            $stmtPosts->bindValue(':id', $id_target, PDO::PARAM_INT);
            $stmtPosts->execute();
            $posts = $stmtPosts->fetchAll(PDO::FETCH_ASSOC);

            // Rutinas
            $stmtRut = $_conexion->prepare(
                "SELECT id_rutina, nombre, descripcion, fecha_creacion
                 FROM rutinas WHERE id_usuario = :id ORDER BY fecha_creacion DESC"
            );
            $stmtRut->bindValue(':id', $id_target, PDO::PARAM_INT);
            $stmtRut->execute();
            $rutinas = $stmtRut->fetchAll(PDO::FETCH_ASSOC);

            // Historias activas
            $stmtHist = $_conexion->prepare(
                "SELECT id_historia, imagen, fecha
                 FROM historias
                 WHERE id_autor = :id AND expira_en > NOW()
                 ORDER BY fecha ASC"
            );
            $stmtHist->bindValue(':id', $id_target, PDO::PARAM_INT);
            $stmtHist->execute();
            $historias = $stmtHist->fetchAll(PDO::FETCH_ASSOC);
        }

        $respuesta['success']            = true;
        $respuesta['es_propio']          = false;
        $respuesta['yo']                 = $me;
        $respuesta['usuario']            = $usuario;
        $respuesta['cuenta_privada']     = $cuentaPrivada;
        $respuesta['solicitud_pendiente'] = (bool) $solicitudPendiente;
        $respuesta['mostrar_contenido']  = (bool) $mostrarContenido;
        $respuesta['posts']              = $posts;
        $respuesta['rutinas']            = $rutinas;
        $respuesta['historias']          = $historias;
        echo json_encode($respuesta);
        exit;

    } catch (PDOException $e) {
        http_response_code(500);
        $respuesta['errores']['general'] = "Error del sistema";
        echo json_encode($respuesta);
        exit;
    }
}

// ── POST — Seguir / Dejar de seguir ─────────────────────────────────────────
if ($method === "POST") {
    $body   = json_decode(file_get_contents('php://input'), true);
    $accion = isset($body['accion']) ? $body['accion'] : '';
    $nick   = isset($body['user'])   ? trim($body['user']) : '';

    $accionesValidas = ['seguir', 'dejar_seguir', 'cancelar_solicitud'];
    if (!in_array($accion, $accionesValidas, true) || $nick === '') {
        http_response_code(400);
        $respuesta['errores']['params'] = "Parámetros inválidos";
        echo json_encode($respuesta);
        exit;
    }

    if ($nick === $_SESSION["nickname"]) {
        http_response_code(400);
        $respuesta['errores']['params'] = "No puedes seguirte a ti mismo";
        echo json_encode($respuesta);
        exit;
    }

    try {
        // Obtener id del target
        $stmtT = $_conexion->prepare(
            "SELECT id_usuario, cuenta_privada FROM usuarios WHERE nickname = :nick AND baneado = 0 LIMIT 1"
        );
        $stmtT->bindValue(':nick', $nick, PDO::PARAM_STR);
        $stmtT->execute();
        $target = $stmtT->fetch(PDO::FETCH_ASSOC);

        if (!$target) {
            http_response_code(404);
            $respuesta['errores']['usuario'] = "Usuario no encontrado";
            echo json_encode($respuesta);
            exit;
        }
        $id_target  = (int) $target['id_usuario'];
        $esPrivada  = (int) $target['cuenta_privada'];

        // ── Cancelar solicitud pendiente ─────────────────────────────
        if ($accion === 'cancelar_solicitud') {
            $_conexion->prepare(
                "DELETE FROM seguidores WHERE id_seguidor = :yo AND id_seguido = :target AND estado = 'pendiente'"
            )->execute([':yo' => $id_yo, ':target' => $id_target]);

            $_conexion->prepare(
                "DELETE FROM notificaciones WHERE id_emisor = :yo AND id_destinatario = :target AND tipo = 'solicitud_seguimiento'"
            )->execute([':yo' => $id_yo, ':target' => $id_target]);

            $count = (int) $_conexion->prepare(
                "SELECT COUNT(*) FROM seguidores WHERE id_seguido = :t AND estado = 'aceptado'"
            )->execute([':t' => $id_target]) ? null : 0;
            $stmtC = $_conexion->prepare("SELECT COUNT(*) AS total FROM seguidores WHERE id_seguido = :t AND estado = 'aceptado'");
            $stmtC->execute([':t' => $id_target]);
            $count = (int) $stmtC->fetch(PDO::FETCH_ASSOC)['total'];

            echo json_encode(['success' => true, 'siguiendo' => false, 'solicitud_pendiente' => false, 'seguidores' => $count]);
            exit;
        }

        // ── Dejar de seguir ──────────────────────────────────────────
        if ($accion === 'dejar_seguir') {
            $_conexion->prepare(
                "DELETE FROM seguidores WHERE id_seguidor = :yo AND id_seguido = :target"
            )->execute([':yo' => $id_yo, ':target' => $id_target]);

            $stmtC = $_conexion->prepare("SELECT COUNT(*) AS total FROM seguidores WHERE id_seguido = :t AND estado = 'aceptado'");
            $stmtC->execute([':t' => $id_target]);
            $count = (int) $stmtC->fetch(PDO::FETCH_ASSOC)['total'];

            echo json_encode(['success' => true, 'siguiendo' => false, 'solicitud_pendiente' => false, 'seguidores' => $count]);
            exit;
        }

        // ── Seguir ───────────────────────────────────────────────────
        if ($accion === 'seguir') {
            // Verificar si ya existe alguna relación
            $stmtEx = $_conexion->prepare(
                "SELECT estado FROM seguidores WHERE id_seguidor = :yo AND id_seguido = :target LIMIT 1"
            );
            $stmtEx->execute([':yo' => $id_yo, ':target' => $id_target]);
            $existing = $stmtEx->fetch(PDO::FETCH_ASSOC);

            $stmtC = $_conexion->prepare("SELECT COUNT(*) AS total FROM seguidores WHERE id_seguido = :t AND estado = 'aceptado'");
            $stmtC->execute([':t' => $id_target]);
            $count = (int) $stmtC->fetch(PDO::FETCH_ASSOC)['total'];

            if ($existing) {
                // Ya existe relación, devolver estado actual
                echo json_encode([
                    'success'             => true,
                    'siguiendo'           => $existing['estado'] === 'aceptado',
                    'solicitud_pendiente' => $existing['estado'] === 'pendiente',
                    'seguidores'          => $count,
                ]);
                exit;
            }

            if ($esPrivada) {
                // Cuenta privada → insertar como pendiente
                $stmtIns = $_conexion->prepare(
                    "INSERT IGNORE INTO seguidores (id_seguidor, id_seguido, estado) VALUES (:yo, :target, 'pendiente')"
                );
                $stmtIns->execute([':yo' => $id_yo, ':target' => $id_target]);

                if ($stmtIns->rowCount() > 0) {
                    $_conexion->prepare(
                        "INSERT INTO notificaciones (id_destinatario, id_emisor, tipo) VALUES (:dest, :emisor, 'solicitud_seguimiento')"
                    )->execute([':dest' => $id_target, ':emisor' => $id_yo]);
                }

                echo json_encode(['success' => true, 'siguiendo' => false, 'solicitud_pendiente' => true, 'seguidores' => $count]);
                exit;
            } else {
                // Cuenta pública → seguir directamente
                $stmtIns = $_conexion->prepare(
                    "INSERT IGNORE INTO seguidores (id_seguidor, id_seguido, estado) VALUES (:yo, :target, 'aceptado')"
                );
                $stmtIns->execute([':yo' => $id_yo, ':target' => $id_target]);

                if ($stmtIns->rowCount() > 0) {
                    $_conexion->prepare(
                        "INSERT INTO notificaciones (id_destinatario, id_emisor, tipo) VALUES (:dest, :emisor, 'nuevo_seguidor')"
                    )->execute([':dest' => $id_target, ':emisor' => $id_yo]);
                    $count++;
                }

                echo json_encode(['success' => true, 'siguiendo' => true, 'solicitud_pendiente' => false, 'seguidores' => $count]);
                exit;
            }
        }

    } catch (PDOException $e) {
        http_response_code(500);
        $respuesta['errores']['general'] = "Error del sistema";
        echo json_encode($respuesta);
        exit;
    }
}

http_response_code(405);
$respuesta['errores']['metodo'] = "Método no permitido";
echo json_encode($respuesta);
exit;
?>
