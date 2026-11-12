<?php
header('Content-Type: application/json');

require "../../../src/config/conexion.php";

session_start();

$respuesta = [
    'success' => false,
    'errores' => [],
    'data' => []
];

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    $respuesta['errores']['metodo'] = "Metodo no permitido";
    echo json_encode($respuesta);
    exit;
}

if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = "Sesion no iniciada";
    echo json_encode($respuesta);
    exit;
}

if (!isset($_SESSION["admin"]) || (int) $_SESSION["admin"] !== 1) {
    http_response_code(403);
    $respuesta['errores']['auth'] = "No tienes permisos de administrador";
    echo json_encode($respuesta);
    exit;
}

try {
    $stmtDeportes = $_conexion->query(
        "SELECT id_deporte, nombre_deporte
         FROM deportes
         ORDER BY nombre_deporte ASC"
    );
    $deportes = $stmtDeportes->fetchAll();

    $stmtEjercicios = $_conexion->query(
        "SELECT e.id_ejercicio, e.nombre_ejercicio, e.id_deporte, d.nombre_deporte
         FROM ejercicios e
         INNER JOIN deportes d ON d.id_deporte = e.id_deporte
         ORDER BY e.id_ejercicio DESC"
    );
    $ejercicios = $stmtEjercicios->fetchAll();

    $respuesta['success'] = true;
    $respuesta['data'] = [
        'deportes' => $deportes,
        'ejercicios' => $ejercicios
    ];

    echo json_encode($respuesta);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema: " . $e->getMessage();
    echo json_encode($respuesta);
    exit;
}
?>
