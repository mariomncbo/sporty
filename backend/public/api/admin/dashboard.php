<?php
// Indicamos que la respuesta de esta API sera JSON.
header('Content-Type: application/json');

require "../../../src/config/conexion.php";
require "../../../src/lib/depurar.php";

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
    // Total de usuarios registrados
    $stmtTotal = $_conexion->query("SELECT COUNT(*) AS total FROM usuarios");
    $totalUsuarios = (int) $stmtTotal->fetch()['total'];

    // Últimos 5 usuarios registrados
    $stmtUltimos = $_conexion->query(
        "SELECT id_usuario, name, nickname, email, admin
         FROM usuarios
         ORDER BY id_usuario DESC
         LIMIT 5"
    );
    $ultimos = $stmtUltimos->fetchAll();

    // Usuarios online (si tienes una tabla/sistema de sesiones, cámbialo aquí)
    $usuariosOnline = 1;

    // Total de reportes activos (Pendientes o En Revisión)
    $stmtReportes = $_conexion->query("SELECT COUNT(*) AS total FROM reportes WHERE estado IN ('Pendiente', 'En Revisión')");
    $totalReportes = (int) $stmtReportes->fetch()['total'];

    // Total de deportes
    $stmtDeportes = $_conexion->query("SELECT COUNT(*) AS total FROM deportes");
    $countDeportes = (int) $stmtDeportes->fetch()['total'];

    // Total de ejercicios
    $stmtEjercicios = $_conexion->query("SELECT COUNT(*) AS total FROM ejercicios");
    $countEjercicios = (int) $stmtEjercicios->fetch()['total'];

    // Total de sitios (asumiendo que hay una tabla 'sitios', si no, dejar en 0)
    $countSitios = 0;
    try {
        $stmtSitios = $_conexion->query("SELECT COUNT(*) AS total FROM sitios");
        $countSitios = (int) $stmtSitios->fetch()['total'];
    } catch (Exception $e) {
        $countSitios = 0;
    }

    $respuesta['success'] = true;
    $respuesta['data'] = [
        'total_usuarios' => $totalUsuarios,
        'usuarios_online' => $usuariosOnline,
        'total_reportes' => $totalReportes,
        'ultimos_registros' => $ultimos,
        'resumen' => [
            'deportes' => $countDeportes,
            'ejercicios' => $countEjercicios,
            'sitios' => $countSitios
        ]
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
