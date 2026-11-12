<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
session_start();

$respuesta = [
    'success' => false,
    'rutinas' => [],
    'errores' => []
];

// Autenticación obligatoria en todos los métodos
if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = "Sesión no iniciada";
    echo json_encode($respuesta);
    exit;
}

// Obtener id del usuario en sesión
try {
    $stmtId = $_conexion->prepare("SELECT id_usuario FROM usuarios WHERE nickname = :nickname LIMIT 1");
    $stmtId->bindValue(':nickname', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmtId->execute();
    $row = $stmtId->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(401);
        $respuesta['errores']['auth'] = "Usuario no encontrado";
        echo json_encode($respuesta);
        exit;
    }
    $id_usuario = (int) $row['id_usuario'];
} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema";
    echo json_encode($respuesta);
    exit;
}

$method = $_SERVER["REQUEST_METHOD"];

// ── Helper: obtener rutinas con stats sociales ──────────────────────────────
function getRutinasConStats(PDO $pdo, int $ownerUserId, int $meId): array {
    $stmt = $pdo->prepare(
        "SELECT r.id_rutina, r.nombre, r.descripcion, r.fecha_creacion,
                (SELECT COUNT(*) FROM rutina_likes      WHERE id_rutina = r.id_rutina) AS likes_count,
                (SELECT COUNT(*) FROM rutina_guardadas  WHERE id_rutina = r.id_rutina) AS guardadas_count,
                (SELECT COUNT(*) FROM rutina_entrenamientos WHERE id_rutina = r.id_rutina) AS entrenamientos_count,
                (SELECT COUNT(*) FROM rutina_likes      WHERE id_rutina = r.id_rutina AND id_usuario = :me1) AS yo_le_di_like,
                (SELECT COUNT(*) FROM rutina_guardadas  WHERE id_rutina = r.id_rutina AND id_usuario = :me2) AS yo_la_guarde
         FROM rutinas r
         WHERE r.id_usuario = :owner
         ORDER BY r.fecha_creacion DESC"
    );
    $stmt->execute([':owner' => $ownerUserId, ':me1' => $meId, ':me2' => $meId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // cast booleans/ints
    return array_map(function($r) {
        $r['likes_count']         = (int) $r['likes_count'];
        $r['guardadas_count']     = (int) $r['guardadas_count'];
        $r['entrenamientos_count']= (int) $r['entrenamientos_count'];
        $r['yo_le_di_like']       = (bool)(int) $r['yo_le_di_like'];
        $r['yo_la_guarde']        = (bool)(int) $r['yo_la_guarde'];
        return $r;
    }, $rows);
}

// ── GET — Listar rutinas ──────────────────────────────────────────────────────
// ?user=nick  → rutinas públicas de otro usuario
// (sin param) → rutinas propias
if ($method === "GET") {
    try {
        $userNick  = isset($_GET['user']) ? trim($_GET['user']) : '';
        $ownerUserId = $id_usuario;

        if ($userNick !== '') {
            // Rutinas de otro usuario
            $stmtOwner = $_conexion->prepare('SELECT id_usuario FROM usuarios WHERE nickname = ? LIMIT 1');
            $stmtOwner->execute([$userNick]);
            $ownerRow = $stmtOwner->fetch(PDO::FETCH_ASSOC);
            if (!$ownerRow) {
                http_response_code(404);
                $respuesta['errores']['user'] = 'Usuario no encontrado';
                echo json_encode($respuesta);
                exit;
            }
            $ownerUserId = (int) $ownerRow['id_usuario'];
        }

        $rutinas = getRutinasConStats($_conexion, $ownerUserId, $id_usuario);

        $respuesta['success'] = true;
        $respuesta['rutinas'] = $rutinas;
        echo json_encode($respuesta);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        $respuesta['errores']['general'] = "Error del sistema";
        echo json_encode($respuesta);
        exit;
    }
}

// ── POST — Crear rutina / acciones sociales ──────────────────────────────────
if ($method === "POST") {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $accion = isset($body['accion']) ? $body['accion'] : 'crear';

    // ── Like / unlike ────────────────────────────────────────────────────────
    if ($accion === 'like') {
        $id_rutina = (int)($body['id_rutina'] ?? 0);
        if (!$id_rutina) { http_response_code(400); echo json_encode(['success'=>false]); exit; }
        // Verificar que la rutina existe y no es propia
        $chk = $_conexion->prepare('SELECT id_rutina FROM rutinas WHERE id_rutina = ? LIMIT 1');
        $chk->execute([$id_rutina]);
        if (!$chk->fetch()) { http_response_code(404); echo json_encode(['success'=>false]); exit; }

        $chkLike = $_conexion->prepare('SELECT id FROM rutina_likes WHERE id_rutina=? AND id_usuario=? LIMIT 1');
        $chkLike->execute([$id_rutina, $id_usuario]);
        if ($chkLike->fetch()) {
            $_conexion->prepare('DELETE FROM rutina_likes WHERE id_rutina=? AND id_usuario=?')
                      ->execute([$id_rutina, $id_usuario]);
            $liked = false;
        } else {
            $_conexion->prepare('INSERT INTO rutina_likes (id_rutina, id_usuario) VALUES (?,?)')
                      ->execute([$id_rutina, $id_usuario]);
            $liked = true;
        }
        $cnt = (int) $_conexion->query("SELECT COUNT(*) FROM rutina_likes WHERE id_rutina=$id_rutina")->fetchColumn();
        echo json_encode(['success'=>true, 'liked'=>$liked, 'likes_count'=>$cnt]);
        exit;
    }

    // ── Guardar (copiar rutina + ejercicios) ─────────────────────────────────
    if ($accion === 'guardar') {
        $id_rutina = (int)($body['id_rutina'] ?? 0);
        if (!$id_rutina) { http_response_code(400); echo json_encode(['success'=>false]); exit; }

        // Obtener rutina original
        $stmtR = $_conexion->prepare('SELECT * FROM rutinas WHERE id_rutina=? LIMIT 1');
        $stmtR->execute([$id_rutina]);
        $rut = $stmtR->fetch(PDO::FETCH_ASSOC);
        if (!$rut) { http_response_code(404); echo json_encode(['success'=>false]); exit; }
        if ((int)$rut['id_usuario'] === $id_usuario) {
            echo json_encode(['success'=>false, 'message'=>'Ya es tuya']);
            exit;
        }

        // Registrar guardada (idempotente)
        try {
            $_conexion->prepare('INSERT IGNORE INTO rutina_guardadas (id_rutina, id_usuario) VALUES (?,?)')
                      ->execute([$id_rutina, $id_usuario]);
        } catch (PDOException $e) {}

        // Copiar rutina
        $nombreCopia = mb_substr($rut['nombre'], 0, 95) . ' (copia)';
        $_conexion->prepare('INSERT INTO rutinas (id_usuario, nombre, descripcion) VALUES (?,?,?)')
                  ->execute([$id_usuario, $nombreCopia, $rut['descripcion']]);
        $newRutinaId = (int) $_conexion->lastInsertId();

        // Copiar ejercicios
        $stmtEj = $_conexion->prepare('SELECT * FROM rutina_ejercicios WHERE id_rutina=? ORDER BY orden ASC');
        $stmtEj->execute([$id_rutina]);
        $ejercicios = $stmtEj->fetchAll(PDO::FETCH_ASSOC);
        $ins = $_conexion->prepare('INSERT INTO rutina_ejercicios (id_rutina, nombre, series, repeticiones, peso_kg, orden) VALUES (?,?,?,?,?,?)');
        foreach ($ejercicios as $ej) {
            $ins->execute([$newRutinaId, $ej['nombre'], $ej['series'], $ej['repeticiones'], $ej['peso_kg'], $ej['orden']]);
        }

        $cnt = (int) $_conexion->query("SELECT COUNT(*) FROM rutina_guardadas WHERE id_rutina=$id_rutina")->fetchColumn();
        echo json_encode(['success'=>true, 'id_rutina_nueva'=>$newRutinaId, 'guardadas_count'=>$cnt,
                          'rutina'=>['id_rutina'=>$newRutinaId,'nombre'=>$nombreCopia,'descripcion'=>$rut['descripcion']]]);
        exit;
    }

    // ── Registrar entrenamiento ───────────────────────────────────────────────
    if ($accion === 'entreno') {
        $id_rutina    = (int)($body['id_rutina'] ?? 0);
        $duracion     = max(0, (int)($body['duracion_segs'] ?? 0));
        if (!$id_rutina) { http_response_code(400); echo json_encode(['success'=>false]); exit; }

        $_conexion->prepare('INSERT INTO rutina_entrenamientos (id_rutina, id_usuario, duracion_segs) VALUES (?,?,?)')
                  ->execute([$id_rutina, $id_usuario, $duracion]);

        $cnt = (int) $_conexion->query("SELECT COUNT(*) FROM rutina_entrenamientos WHERE id_rutina=$id_rutina")->fetchColumn();
        echo json_encode(['success'=>true, 'entrenamientos_count'=>$cnt]);
        exit;
    }

    // ── Crear rutina (acción por defecto) ────────────────────────────────────
    $nombre      = isset($body['nombre'])      ? trim($body['nombre'])      : '';
    $descripcion = isset($body['descripcion']) ? trim($body['descripcion']) : '';

    if ($nombre === '') {
        http_response_code(400);
        $respuesta['errores']['nombre'] = "El nombre es obligatorio";
        echo json_encode($respuesta);
        exit;
    }

    if (mb_strlen($nombre) > 100) {
        http_response_code(400);
        $respuesta['errores']['nombre'] = "El nombre no puede superar 100 caracteres";
        echo json_encode($respuesta);
        exit;
    }

    try {
        $stmt = $_conexion->prepare(
            "INSERT INTO rutinas (id_usuario, nombre, descripcion) VALUES (:id_usuario, :nombre, :descripcion)"
        );
        $stmt->bindValue(':id_usuario',   $id_usuario,  PDO::PARAM_INT);
        $stmt->bindValue(':nombre',       $nombre,      PDO::PARAM_STR);
        $stmt->bindValue(':descripcion',  $descripcion, PDO::PARAM_STR);
        $stmt->execute();

        $respuesta['success']   = true;
        $respuesta['id_rutina'] = (int) $_conexion->lastInsertId();
        echo json_encode($respuesta);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        $respuesta['errores']['general'] = "Error del sistema";
        echo json_encode($respuesta);
        exit;
    }
}

// ── DELETE — Eliminar rutina ─────────────────────────────────────────────────
if ($method === "DELETE") {
    $body      = json_decode(file_get_contents('php://input'), true);
    $id_rutina = isset($body['id_rutina']) ? (int) $body['id_rutina'] : 0;

    if ($id_rutina <= 0) {
        http_response_code(400);
        $respuesta['errores']['id'] = "ID de rutina inválido";
        echo json_encode($respuesta);
        exit;
    }

    try {
        // Solo puede eliminar sus propias rutinas
        $stmt = $_conexion->prepare(
            "DELETE FROM rutinas WHERE id_rutina = :id_rutina AND id_usuario = :id_usuario"
        );
        $stmt->bindValue(':id_rutina',   $id_rutina,  PDO::PARAM_INT);
        $stmt->bindValue(':id_usuario',  $id_usuario, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            $respuesta['errores']['rutina'] = "Rutina no encontrada o no tienes permiso";
            echo json_encode($respuesta);
            exit;
        }

        $respuesta['success'] = true;
        echo json_encode($respuesta);
        exit;
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
