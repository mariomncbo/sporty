<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
session_start();

$respuesta = [
    'success' => false,
    'usuario' => null,
    'errores' => []
];

if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = "Sesión no iniciada";
    echo json_encode($respuesta);
    exit;
}

try {
    $stmt = $_conexion->prepare("SELECT name, nickname, foto_perfil FROM usuarios WHERE nickname = :nickname LIMIT 1");
    $stmt->bindValue(':nickname', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmt->execute();
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($usuario) {
        $respuesta['success'] = true;
        $respuesta['usuario'] = $usuario;
    } else {
        http_response_code(404);
        $respuesta['errores']['usuario'] = "Usuario no encontrado";
    }
    echo json_encode($respuesta);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema: " . $e->getMessage();
    echo json_encode($respuesta);
    exit;
}
?>
