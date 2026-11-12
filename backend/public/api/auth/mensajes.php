<?php
session_start();
require_once __DIR__ . '/../../../src/config/conexion.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!isset($_SESSION['nickname'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$pdo    = $_conexion;
$miNick = $_SESSION['nickname'];

$stmt = $pdo->prepare('SELECT id_usuario, name, nickname, foto_perfil FROM usuarios WHERE nickname = ?');
$stmt->execute([$miNick]);
$yo = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$yo) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}
$miId = (int)$yo['id_usuario'];

// ── GET ─────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // Contador de mensajes no leídos totales
    if (isset($_GET['count'])) {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) AS total
             FROM mensajes m
             JOIN conversaciones c ON m.id_conversacion = c.id_conversacion
             WHERE (c.id_usuario1 = :me OR c.id_usuario2 = :me2)
               AND m.id_emisor != :me3
               AND m.leido = 0'
        );
        $stmt->execute([':me' => $miId, ':me2' => $miId, ':me3' => $miId]);
        $total = (int)$stmt->fetchColumn();
        echo json_encode(['success' => true, 'no_leidos' => $total]);
        exit;
    }

    // Buscar usuarios para iniciar conversación
    if (isset($_GET['buscar'])) {
        $q = '%' . trim($_GET['buscar']) . '%';
        $stmt = $pdo->prepare(
            'SELECT id_usuario, name, nickname, foto_perfil
             FROM usuarios
             WHERE (name LIKE ? OR nickname LIKE ?)
               AND id_usuario != ?
               AND baneado = 0
             ORDER BY name ASC
             LIMIT 10'
        );
        $stmt->execute([$q, $q, $miId]);
        echo json_encode(['success' => true, 'usuarios' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // Mensajes de una conversación
    if (isset($_GET['id_conversacion'])) {
        $idConv  = (int)$_GET['id_conversacion'];
        $ultimoId = isset($_GET['ultimo_id']) ? (int)$_GET['ultimo_id'] : 0;

        // Verificar acceso
        $stmt = $pdo->prepare(
            'SELECT id_conversacion, id_usuario1, id_usuario2
             FROM conversaciones
             WHERE id_conversacion = ? AND (id_usuario1 = ? OR id_usuario2 = ?)'
        );
        $stmt->execute([$idConv, $miId, $miId]);
        $conv = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$conv) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sin acceso']);
            exit;
        }

        $otroId = ((int)$conv['id_usuario1'] === $miId) ? (int)$conv['id_usuario2'] : (int)$conv['id_usuario1'];
        $stmt = $pdo->prepare('SELECT id_usuario, name, nickname, foto_perfil FROM usuarios WHERE id_usuario = ?');
        $stmt->execute([$otroId]);
        $otro = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($ultimoId > 0) {
            // Polling: sólo mensajes nuevos
            $stmt = $pdo->prepare(
                'SELECT id_mensaje, id_emisor, contenido, fecha, leido
                 FROM mensajes
                 WHERE id_conversacion = ? AND id_mensaje > ?
                 ORDER BY fecha ASC'
            );
            $stmt->execute([$idConv, $ultimoId]);
        } else {
            // Carga inicial: todos los mensajes + marcar leídos
            $pdo->prepare(
                'UPDATE mensajes SET leido = 1 WHERE id_conversacion = ? AND id_emisor != ?'
            )->execute([$idConv, $miId]);

            $stmt = $pdo->prepare(
                'SELECT id_mensaje, id_emisor, contenido, fecha, leido
                 FROM mensajes
                 WHERE id_conversacion = ?
                 ORDER BY fecha ASC
                 LIMIT 200'
            );
            $stmt->execute([$idConv]);
        }

        $msgs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($msgs as &$m) {
            $m['es_mio'] = ((int)$m['id_emisor'] === $miId);
            $m['leido']  = (int)$m['leido'];
        }

        // Último mensaje propio que ha sido leído por el otro
        $stmtUL = $pdo->prepare(
            'SELECT COALESCE(MAX(id_mensaje), 0) FROM mensajes
             WHERE id_conversacion = ? AND id_emisor = ? AND leido = 1'
        );
        $stmtUL->execute([$idConv, $miId]);
        $ultimoLeido = (int)$stmtUL->fetchColumn();

        echo json_encode([
            'success'       => true,
            'otro_usuario'  => $otro,
            'mensajes'      => $msgs,
            'ultimo_leido'  => $ultimoLeido,
        ]);
        exit;
    }

    // Lista de conversaciones
    $stmt = $pdo->prepare(
        'SELECT
            c.id_conversacion,
            CASE WHEN c.id_usuario1 = :me1 THEN c.id_usuario2 ELSE c.id_usuario1 END AS otro_id,
            c.ultima_actualizacion,
            u.name         AS otro_name,
            u.nickname     AS otro_nickname,
            u.foto_perfil  AS otro_foto,
            (SELECT contenido  FROM mensajes WHERE id_conversacion = c.id_conversacion ORDER BY fecha DESC LIMIT 1) AS ultimo_contenido,
            (SELECT id_emisor  FROM mensajes WHERE id_conversacion = c.id_conversacion ORDER BY fecha DESC LIMIT 1) AS ultimo_emisor,
            (SELECT fecha      FROM mensajes WHERE id_conversacion = c.id_conversacion ORDER BY fecha DESC LIMIT 1) AS ultimo_fecha,
            (SELECT COUNT(*)   FROM mensajes WHERE id_conversacion = c.id_conversacion AND id_emisor != :me2 AND leido = 0) AS no_leidos
         FROM conversaciones c
         JOIN usuarios u ON u.id_usuario = CASE WHEN c.id_usuario1 = :me3 THEN c.id_usuario2 ELSE c.id_usuario1 END
         WHERE c.id_usuario1 = :me4 OR c.id_usuario2 = :me5
         ORDER BY c.ultima_actualizacion DESC'
    );
    $stmt->execute([
        ':me1' => $miId, ':me2' => $miId, ':me3' => $miId,
        ':me4' => $miId, ':me5' => $miId,
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $conversaciones = [];
    foreach ($rows as $r) {
        $conversaciones[] = [
            'id_conversacion' => (int)$r['id_conversacion'],
            'otro_usuario'    => [
                'id_usuario'  => (int)$r['otro_id'],
                'name'        => $r['otro_name'],
                'nickname'    => $r['otro_nickname'],
                'foto_perfil' => $r['otro_foto'],
            ],
            'ultimo_mensaje'  => $r['ultimo_contenido'] !== null ? [
                'contenido' => $r['ultimo_contenido'],
                'es_mio'    => ((int)$r['ultimo_emisor'] === $miId),
                'fecha'     => $r['ultimo_fecha'],
            ] : null,
            'no_leidos'       => (int)$r['no_leidos'],
        ];
    }

    echo json_encode([
        'success'        => true,
        'yo'             => $yo,
        'conversaciones' => $conversaciones,
    ]);
    exit;
}

// ── DELETE — borrar mensaje propio ──────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $idMsg = (int)($body['id_mensaje'] ?? 0);
    if ($idMsg <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false]);
        exit;
    }
    // Verificar que el mensaje pertenece al usuario actual
    $stmt = $pdo->prepare('SELECT id_mensaje FROM mensajes WHERE id_mensaje = ? AND id_emisor = ?');
    $stmt->execute([$idMsg, $miId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Sin permiso']);
        exit;
    }
    $pdo->prepare('DELETE FROM mensajes WHERE id_mensaje = ?')->execute([$idMsg]);
    echo json_encode(['success' => true]);
    exit;
}

// ── POST ────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $accion = trim($body['accion'] ?? '');

    // Iniciar o recuperar conversación
    if ($accion === 'iniciar') {
        $nick = trim($body['nick'] ?? '');
        if (!$nick) {
            echo json_encode(['success' => false, 'message' => 'Nick requerido']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id_usuario FROM usuarios WHERE nickname = ? AND baneado = 0');
        $stmt->execute([$nick]);
        $otro = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$otro) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            exit;
        }

        $otroId = (int)$otro['id_usuario'];
        if ($otroId === $miId) {
            echo json_encode(['success' => false, 'message' => 'No puedes escribirte a ti mismo']);
            exit;
        }

        // Orden normalizado para UNIQUE KEY
        $u1 = min($miId, $otroId);
        $u2 = max($miId, $otroId);

        $stmt = $pdo->prepare(
            'SELECT id_conversacion FROM conversaciones WHERE id_usuario1 = ? AND id_usuario2 = ?'
        );
        $stmt->execute([$u1, $u2]);
        $conv = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$conv) {
            $pdo->prepare('INSERT INTO conversaciones (id_usuario1, id_usuario2) VALUES (?, ?)')->execute([$u1, $u2]);
            $idConv = (int)$pdo->lastInsertId();
        } else {
            $idConv = (int)$conv['id_conversacion'];
        }

        echo json_encode(['success' => true, 'id_conversacion' => $idConv]);
        exit;
    }

    // Enviar mensaje
    if ($accion === 'enviar') {
        $idConv   = (int)($body['id_conversacion'] ?? 0);
        $contenido = trim($body['contenido'] ?? '');

        if (!$idConv || $contenido === '') {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            exit;
        }

        // Limitar longitud
        $contenido = mb_substr($contenido, 0, 1000);

        // Verificar acceso
        $stmt = $pdo->prepare(
            'SELECT id_conversacion FROM conversaciones
             WHERE id_conversacion = ? AND (id_usuario1 = ? OR id_usuario2 = ?)'
        );
        $stmt->execute([$idConv, $miId, $miId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sin acceso']);
            exit;
        }

        $pdo->prepare(
            'INSERT INTO mensajes (id_conversacion, id_emisor, contenido) VALUES (?, ?, ?)'
        )->execute([$idConv, $miId, $contenido]);

        $idMsg = (int)$pdo->lastInsertId();

        // Notificación al destinatario (si no tiene ya una no leída de este emisor en esta conv)
        $stmtConv = $pdo->prepare(
            'SELECT id_usuario1, id_usuario2 FROM conversaciones WHERE id_conversacion = ?'
        );
        $stmtConv->execute([$idConv]);
        $convData = $stmtConv->fetch(PDO::FETCH_ASSOC);
        if ($convData) {
            $destId = ((int)$convData['id_usuario1'] === $miId)
                ? (int)$convData['id_usuario2']
                : (int)$convData['id_usuario1'];

            // Evitar spam: solo insertar si no hay ya una notif no leída de este emisor+conv
            $stmtCheck = $pdo->prepare("
                SELECT COUNT(*) FROM notificaciones
                WHERE id_destinatario = ? AND id_emisor = ? AND tipo = 'nuevo_mensaje'
                  AND id_referencia = ? AND leida = 0
            ");
            $stmtCheck->execute([$destId, $miId, $idConv]);
            if ((int)$stmtCheck->fetchColumn() === 0) {
                $pdo->prepare("
                    INSERT INTO notificaciones (id_destinatario, id_emisor, tipo, id_referencia)
                    VALUES (?, ?, 'nuevo_mensaje', ?)
                ")->execute([$destId, $miId, $idConv]);
            }
        }

        $stmt = $pdo->prepare('SELECT id_mensaje, contenido, fecha FROM mensajes WHERE id_mensaje = ?');
        $stmt->execute([$idMsg]);
        $msg = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'mensaje' => [
                'id_mensaje' => (int)$msg['id_mensaje'],
                'contenido'  => $msg['contenido'],
                'fecha'      => $msg['fecha'],
                'es_mio'     => true,
            ],
        ]);
        exit;
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método no permitido']);
