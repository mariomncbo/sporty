<?php
header('Content-Type: application/json');
require_once('../../../src/config/conexion.php');
require_once('../../../src/lib/subir_imagen.php');
session_start();

$respuesta = ['success' => false, 'message' => '', 'historia' => null];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    $respuesta['message'] = 'Método no permitido';
    echo json_encode($respuesta);
    exit;
}

if (!isset($_SESSION['nickname'])) {
    http_response_code(401);
    $respuesta['message'] = 'Sesión no iniciada';
    echo json_encode($respuesta);
    exit;
}

if (empty($_FILES['imagen']) || $_FILES['imagen']['error'] === UPLOAD_ERR_NO_FILE) {
    http_response_code(400);
    $respuesta['message'] = 'Debes adjuntar una imagen';
    echo json_encode($respuesta);
    exit;
}

try {
    // Obtener id del usuario de sesión
    $stmt = $_conexion->prepare('SELECT id_usuario FROM usuarios WHERE nickname = :nickname LIMIT 1');
    $stmt->bindValue(':nickname', $_SESSION['nickname'], PDO::PARAM_STR);
    $stmt->execute();
    $usuario = $stmt->fetch();

    if (!$usuario) {
        http_response_code(401);
        $respuesta['message'] = 'Usuario no encontrado';
        echo json_encode($respuesta);
        exit;
    }

    // Subir imagen — nombre único sanitizado por subir_imagen.php
    $rutaRelativa = subirImagen($_FILES['imagen'], 'stories');
    // Ruta accesible desde el navegador relativa a la raíz web del proyecto
    $rutaWeb = '/backend/public/' . $rutaRelativa;

    // Calcular expiración a 24 horas vista
    $expira = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Insertar historia en BD
    $stmtHistoria = $_conexion->prepare(
        'INSERT INTO historias (id_autor, imagen, expira_en) VALUES (:id_autor, :imagen, :expira_en)'
    );
    $stmtHistoria->bindValue(':id_autor',  (int) $usuario['id_usuario'], PDO::PARAM_INT);
    $stmtHistoria->bindValue(':imagen',    $rutaWeb,                     PDO::PARAM_STR);
    $stmtHistoria->bindValue(':expira_en', $expira,                      PDO::PARAM_STR);
    $stmtHistoria->execute();

    $respuesta['success']  = true;
    $respuesta['message']  = 'Historia publicada correctamente';
    $respuesta['historia'] = [
        'id_historia' => (int) $_conexion->lastInsertId(),
        'imagen'      => $rutaWeb,
        'expira_en'   => $expira,
    ];

    echo json_encode($respuesta);
    exit;

} catch (RuntimeException $e) {
    http_response_code(422);
    $respuesta['message'] = $e->getMessage();
    echo json_encode($respuesta);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['message'] = 'Error del sistema';
    echo json_encode($respuesta);
    exit;
}
