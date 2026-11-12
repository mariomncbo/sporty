<?php
header('Content-Type: application/json');

require "../../../src/config/conexion.php";

session_start();

$respuesta = [
    'success' => false,
    'errores' => [],
    'data' => []
];

if ($_SERVER["REQUEST_METHOD"] !== "PATCH") {
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

$input = json_decode(file_get_contents('php://input'), true);

$estadosValidos = ['Pendiente', 'En Revisión', 'Resuelto', 'Desestimado'];

if (!isset($input['id_reporte']) || (int) $input['id_reporte'] <= 0) {
    http_response_code(400);
    $respuesta['errores']['input'] = "ID de reporte invalido o ausente";
    echo json_encode($respuesta);
    exit;
}

if (!isset($input['estado']) || !in_array($input['estado'], $estadosValidos, true)) {
    http_response_code(400);
    $respuesta['errores']['input'] = "Estado invalido. Valores permitidos: " . implode(', ', $estadosValidos);
    echo json_encode($respuesta);
    exit;
}

$idReporte = (int) $input['id_reporte'];
$estado    = $input['estado'];

try {
    $stmt = $_conexion->prepare("UPDATE reportes SET estado = ? WHERE id_reporte = ?");
    $stmt->execute([$estado, $idReporte]);

    if ($stmt->rowCount() > 0) {
        $respuesta['success'] = true;
        $respuesta['data']['mensaje'] = "Estado actualizado a '$estado' correctamente.";
    } else {
        http_response_code(404);
        $respuesta['errores']['bd'] = "No se encontro el reporte (puede que ya haya sido eliminado).";
    }

    echo json_encode($respuesta);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error de base de datos.";
    echo json_encode($respuesta);
    exit;
}
?>
