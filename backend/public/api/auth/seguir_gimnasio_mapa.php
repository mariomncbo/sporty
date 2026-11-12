<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
session_start();

// 1. Seguridad
if (!isset($_SESSION["nickname"])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

// 2. Leer lo que nos manda JavaScript
$data = json_decode(file_get_contents("php://input"), true);
$place_id = $data['place_id'] ?? '';
$accion = $data['accion'] ?? ''; // Será 'seguir' o 'dejar'

if (empty($place_id) || empty($accion)) {
    echo json_encode(['success' => false, 'error' => 'Faltan datos']);
    exit;
}

try {
    // 3. Sacar TU ID de usuario
    $stmtMe = $_conexion->prepare("SELECT id_usuario FROM usuarios WHERE nickname = :nick LIMIT 1");
    $stmtMe->bindValue(':nick', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmtMe->execute();
    $me = $stmtMe->fetch(PDO::FETCH_ASSOC);
    if(!$me) { echo json_encode(['success' => false]); exit; }
    $mi_id = (int)$me['id_usuario'];

    // 4. Guardar o borrar en la BD
    if ($accion === 'seguir') {
        // Usamos INSERT IGNORE por si acaso clica dos veces rápido
        $stmt = $_conexion->prepare("INSERT IGNORE INTO gimnasios_seguidos (id_usuario, place_id) VALUES (:id_usuario, :place_id)");
    } else {
        $stmt = $_conexion->prepare("DELETE FROM gimnasios_seguidos WHERE id_usuario = :id_usuario AND place_id = :place_id");
    }
    
    $stmt->bindValue(':id_usuario', $mi_id, PDO::PARAM_INT);
    $stmt->bindValue(':place_id', $place_id, PDO::PARAM_STR);
    $success = $stmt->execute();

    echo json_encode(['success' => $success]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>