<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
session_start();

$respuesta = ['success' => false, 'errores' => []];

if (!isset($_SESSION['nickname'])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = 'Sesión no iniciada';
    echo json_encode($respuesta);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode($respuesta);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id_seguido = isset($input['id_usuario']) ? (int) $input['id_usuario'] : 0;

if ($id_seguido <= 0) {
    http_response_code(400);
    $respuesta['errores']['id'] = 'ID de usuario no válido';
    echo json_encode($respuesta);
    exit;
}

try {
    $pdo = $_conexion;

    // Obtener id del usuario actual
    $stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE nickname = :nick");
    $stmt->execute([':nick' => $_SESSION['nickname']]);
    $me = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$me || $me['id_usuario'] === $id_seguido) {
        http_response_code(400);
        $respuesta['errores']['self'] = 'Operación no permitida';
        echo json_encode($respuesta);
        exit;
    }

    $id_yo = (int) $me['id_usuario'];

    // Verificar si ya existe alguna relación (aceptado o pendiente)
    $stmt = $pdo->prepare("SELECT estado FROM seguidores WHERE id_seguidor = :yo AND id_seguido = :el LIMIT 1");
    $stmt->execute([':yo' => $id_yo, ':el' => $id_seguido]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // Dejar de seguir o cancelar solicitud
        $pdo->prepare("DELETE FROM seguidores WHERE id_seguidor = :yo AND id_seguido = :el")
            ->execute([':yo' => $id_yo, ':el' => $id_seguido]);

        if ($existing['estado'] === 'pendiente') {
            $pdo->prepare("DELETE FROM notificaciones WHERE id_emisor = :yo AND id_destinatario = :el AND tipo = 'solicitud_seguimiento'")
                ->execute([':yo' => $id_yo, ':el' => $id_seguido]);
        }
        $respuesta['accion'] = 'dejado';
    } else {
        // Comprobar si la cuenta destino es privada
        $stmtPriv = $pdo->prepare("SELECT cuenta_privada FROM usuarios WHERE id_usuario = :id LIMIT 1");
        $stmtPriv->execute([':id' => $id_seguido]);
        $targetData = $stmtPriv->fetch(PDO::FETCH_ASSOC);
        $esPrivada  = $targetData ? (int) $targetData['cuenta_privada'] : 0;

        if ($esPrivada) {
            $pdo->prepare("INSERT INTO seguidores (id_seguidor, id_seguido, estado) VALUES (:yo, :el, 'pendiente')")
                ->execute([':yo' => $id_yo, ':el' => $id_seguido]);
            $pdo->prepare("INSERT INTO notificaciones (id_destinatario, id_emisor, tipo) VALUES (:dest, :emisor, 'solicitud_seguimiento')")
                ->execute([':dest' => $id_seguido, ':emisor' => $id_yo]);
            $respuesta['accion'] = 'pendiente';
        } else {
            $pdo->prepare("INSERT INTO seguidores (id_seguidor, id_seguido, estado) VALUES (:yo, :el, 'aceptado')")
                ->execute([':yo' => $id_yo, ':el' => $id_seguido]);
            $pdo->prepare("INSERT INTO notificaciones (id_destinatario, id_emisor, tipo) VALUES (:dest, :emisor, 'nuevo_seguidor')")
                ->execute([':dest' => $id_seguido, ':emisor' => $id_yo]);
            $respuesta['accion'] = 'seguido';
        }
    }

    $respuesta['success'] = true;
    echo json_encode($respuesta);

} catch (Exception $e) {
    http_response_code(500);
    $respuesta['errores']['db'] = 'Error interno';
    echo json_encode($respuesta);
}
