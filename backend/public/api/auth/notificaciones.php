<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once('../../../src/config/conexion.php');
session_start();

$respuesta = ['success' => false, 'message' => ''];

if (!isset($_SESSION['nickname'])) {
    http_response_code(401);
    $respuesta['message'] = 'No autenticado';
    echo json_encode($respuesta);
    exit;
}

$pdo = $_conexion;

// Obtener id del usuario de sesión
$stmt = $pdo->prepare('SELECT id_usuario FROM usuarios WHERE nickname = ? LIMIT 1');
$stmt->execute([$_SESSION['nickname']]);
$yo = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$yo) {
    http_response_code(401);
    $respuesta['message'] = 'Usuario no encontrado';
    echo json_encode($respuesta);
    exit;
}

$miId = (int) $yo['id_usuario'];

// ── GET — listar notificaciones o contar no leídas ────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // ?count=1 → sólo devuelve el número de no leídas (para el badge del nav)
    if (isset($_GET['count'])) {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM notificaciones WHERE id_destinatario = ? AND leida = 0');
        $stmt->execute([$miId]);
        echo json_encode(['success' => true, 'no_leidas' => (int) $stmt->fetchColumn()]);
        exit;
    }

    // Listar las últimas 50 notificaciones con datos del emisor
    $stmt = $pdo->prepare("
        SELECT
            n.id_notificacion,
            n.id_emisor,
            n.tipo,
            n.id_referencia,
            n.leida,
            n.fecha,
            u.nickname    AS emisor_nick,
            u.name        AS emisor_name,
            u.foto_perfil AS emisor_foto
        FROM notificaciones n
        JOIN usuarios u ON u.id_usuario = n.id_emisor
        WHERE n.id_destinatario = ?
        ORDER BY n.fecha DESC
        LIMIT 50
    ");
    $stmt->execute([$miId]);
    $notificaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Marcar todas como leídas al consultarlas
    $pdo->prepare('UPDATE notificaciones SET leida = 1 WHERE id_destinatario = ? AND leida = 0')
        ->execute([$miId]);

    echo json_encode(['success' => true, 'notificaciones' => $notificaciones]);
    exit;
}

// ── POST — Aceptar o rechazar solicitud de seguimiento ────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input     = json_decode(file_get_contents('php://input'), true);
    $accion    = $input['accion']          ?? '';
    $id_emisor = isset($input['id_emisor']) ? (int) $input['id_emisor'] : 0;
    $id_notif  = isset($input['id_notificacion']) ? (int) $input['id_notificacion'] : 0;

    if (!in_array($accion, ['aceptar_solicitud', 'rechazar_solicitud'], true) || $id_emisor <= 0) {
        http_response_code(400);
        $respuesta['message'] = 'Acción no válida';
        echo json_encode($respuesta);
        exit;
    }

    if ($accion === 'aceptar_solicitud') {
        $stmt = $pdo->prepare(
            "UPDATE seguidores SET estado = 'aceptado'
             WHERE id_seguidor = ? AND id_seguido = ? AND estado = 'pendiente'"
        );
        $stmt->execute([$id_emisor, $miId]);

        if ($stmt->rowCount() > 0) {
            // Notificar al solicitante que fue aceptado
            $pdo->prepare(
                "INSERT INTO notificaciones (id_destinatario, id_emisor, tipo) VALUES (?, ?, 'nuevo_seguidor')"
            )->execute([$id_emisor, $miId]);
        }
    } else {
        // Rechazar: eliminar la fila pendiente
        $pdo->prepare(
            "DELETE FROM seguidores WHERE id_seguidor = ? AND id_seguido = ? AND estado = 'pendiente'"
        )->execute([$id_emisor, $miId]);
    }

    // Eliminar la notificación de solicitud en ambos casos
    if ($id_notif > 0) {
        $pdo->prepare(
            "DELETE FROM notificaciones WHERE id_notificacion = ? AND id_destinatario = ?"
        )->execute([$id_notif, $miId]);
    }

    echo json_encode(['success' => true]);
    exit;
}

// ── DELETE — borrar una notificación propia ────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id    = isset($input['id_notificacion']) ? (int) $input['id_notificacion'] : 0;

    if ($id <= 0) {
        http_response_code(400);
        $respuesta['message'] = 'ID no válido';
        echo json_encode($respuesta);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM notificaciones WHERE id_notificacion = ? AND id_destinatario = ?');
    $stmt->execute([$id, $miId]);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
$respuesta['message'] = 'Método no permitido';
echo json_encode($respuesta);
