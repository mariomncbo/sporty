<?php
header('Content-Type: application/json');
// Usamos tu archivo central de conexión ¡La clave de que todo funcione!
require_once("../../../src/config/conexion.php");
session_start();

// Validamos que el usuario esté logueado
if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    echo json_encode(['error' => 'Sesión no iniciada', 'total' => 0]);
    exit;
}

$place_id = $_GET['place_id'] ?? '';

if (empty($place_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta el ID del gimnasio', 'total' => 0]);
    exit;
}

try {
    // 1. Obtenemos TU id_usuario a partir del nickname de la sesión (Igual que en perfil.php)
    $stmtMe = $_conexion->prepare("SELECT id_usuario FROM usuarios WHERE nickname = :nick LIMIT 1");
    $stmtMe->bindValue(':nick', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmtMe->execute();
    $me = $stmtMe->fetch(PDO::FETCH_ASSOC);
    
    if (!$me) { 
        http_response_code(401); 
        echo json_encode(['error' => 'Usuario no encontrado', 'total' => 0]); 
        exit; 
    }
    $mi_id = (int) $me['id_usuario'];

    // 2. Buscamos amigos mutuos en el gimnasio usando TU variable $_conexion
    // 2. Buscamos amigos mutuos que SIGUEN a este gimnasio
    $sql = "
        SELECT u.id_usuario, u.nickname, u.foto_perfil 
        FROM usuarios u
        JOIN gimnasios_seguidos gs ON u.id_usuario = gs.id_usuario
        JOIN seguidores s1 ON u.id_usuario = s1.id_seguido AND s1.id_seguidor = :mi_id AND s1.estado = 'aceptado'
        JOIN seguidores s2 ON u.id_usuario = s2.id_seguidor AND s2.id_seguido = :mi_id AND s2.estado = 'aceptado'
        WHERE gs.place_id = :place_id
    ";

    $stmt = $_conexion->prepare($sql);
    $stmt->bindValue(':mi_id', $mi_id, PDO::PARAM_INT);
    $stmt->bindValue(':place_id', $place_id, PDO::PARAM_STR);
    $stmt->execute();

    $amigos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // NUEVO: Comprobar si el usuario actual sigue a este gimnasio
    $stmtSeguimiento = $_conexion->prepare("SELECT id FROM gimnasios_seguidos WHERE id_usuario = :mi_id AND place_id = :place_id LIMIT 1");
    $stmtSeguimiento->bindValue(':mi_id', $mi_id, PDO::PARAM_INT);
    $stmtSeguimiento->bindValue(':place_id', $place_id, PDO::PARAM_STR);
    $stmtSeguimiento->execute();
    
    // Si encuentra algo, es true. Si no, false.
    $siguiendo = $stmtSeguimiento->fetch() ? true : false;

    // Devolvemos los datos correctamente añadiendo el estado de seguimiento
    echo json_encode([
        'total' => count($amigos),
        'amigos' => $amigos,
        'siguiendo' => $siguiendo // <-- Enviamos esto a JavaScript
    ]);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
    exit;
}
?>