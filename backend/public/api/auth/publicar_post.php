<?php
header('Content-Type: application/json');
require_once('../../../src/config/conexion.php');
require_once('../../../src/lib/subir_imagen.php');
session_start();

$respuesta = ['success' => false, 'message' => '', 'post' => null];

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

// Validar que viene imagen
if (empty($_FILES['imagen']) || $_FILES['imagen']['error'] === UPLOAD_ERR_NO_FILE) {
    http_response_code(400);
    $respuesta['message'] = 'Debes adjuntar una imagen';
    echo json_encode($respuesta);
    exit;
}

// Caption es opcional pero limitado
$caption = isset($_POST['caption']) ? mb_substr(trim($_POST['caption']), 0, 2200) : '';

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
    $rutaRelativa = subirImagen($_FILES['imagen'], 'posts');
    // Ruta accesible desde el navegador relativa a la raíz web del proyecto
    $rutaWeb = '/backend/public/' . $rutaRelativa;

    // Insertar post en BD
    $stmtPost = $_conexion->prepare(
        'INSERT INTO posts (id_autor, contenido, imagen) VALUES (:id_autor, :contenido, :imagen)'
    );
    $stmtPost->bindValue(':id_autor',  (int) $usuario['id_usuario'], PDO::PARAM_INT);
    $stmtPost->bindValue(':contenido', $caption,                     PDO::PARAM_STR);
    $stmtPost->bindValue(':imagen',    $rutaWeb,                     PDO::PARAM_STR);
    $stmtPost->execute();

    $respuesta['success'] = true;
    $respuesta['message'] = 'Post publicado correctamente';
    $respuesta['post']    = [
        'id_post'   => (int) $_conexion->lastInsertId(),
        'imagen'    => $rutaWeb,
        'contenido' => $caption,
    ];

    echo json_encode($respuesta);
    exit;

} catch (RuntimeException $e) {
    // Error de validación de imagen (tipo MIME, tamaño, etc.)
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
