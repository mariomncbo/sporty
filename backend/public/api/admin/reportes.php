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
    // 1. Preparamos la consulta SQL.
    $sql = "SELECT 
                r.id_reporte,
                r.id_reportado,
                r.tipo_reporte,
                r.descripcion,
                r.estado,
                r.fecha_creacion,
                ue.nickname AS emisor_nickname,
                ur.nickname AS reportado_nickname
            FROM reportes r
            JOIN usuarios ue ON r.id_emisor = ue.id_usuario
            LEFT JOIN usuarios ur ON r.id_reportado = ur.id_usuario
            ORDER BY 
                FIELD(r.estado, 'Pendiente', 'En Revisión', 'Resuelto', 'Desestimado'),
                r.fecha_creacion DESC";

    // 2. Ejecutamos la consulta.
    $stmt = $_conexion->prepare($sql);
    $stmt->execute();

    // 3. Obtenemos todos los resultados como un array asociativo.
    $reportes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Llenamos el array de respuesta indicando que todo ha ido bien.
    $respuesta['success'] = true;
    $respuesta['data'] = $reportes;

    // 5. Enviamos el JSON al frontend.
    http_response_code(200);
    echo json_encode($respuesta);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error de base de datos: " . $e->getMessage();
    echo json_encode($respuesta);
    exit;
}

?>