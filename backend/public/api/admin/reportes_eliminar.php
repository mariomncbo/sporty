<?php
header('Content-Type: application/json');
require "../../../src/config/conexion.php";

session_start();

$respuesta = [
    'success' => false,
    'errores' => [],
    'data' => []
];

// 1. Verificamos que el método sea DELETE (Buenas prácticas REST)
if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
    http_response_code(405);
    $respuesta['errores']['metodo'] = "Metodo no permitido";
    echo json_encode($respuesta);
    exit;
}

// 2. Verificaciones de seguridad (Sesión y Admin)
if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = "Sesion no iniciada";
    echo json_encode($respuesta);
    exit;
}

if (!isset($_SESSION["admin"]) || (int)$_SESSION["admin"] !== 1) {
    http_response_code(403);
    $respuesta['errores']['auth'] = "No tienes permisos de administrador";
    echo json_encode($respuesta);
    exit;
}

// 3. Obtener el ID del reporte enviado por JS
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id_reporte']) || (int)$input['id_reporte'] <= 0) {
    http_response_code(400);
    $respuesta['errores']['input'] = "ID de reporte invalido o ausente";
    echo json_encode($respuesta);
    exit;
}

$idReporte = (int)$input['id_reporte'];

// 4. Ejecutar el borrado
try {
    $stmt = $_conexion->prepare("DELETE FROM reportes WHERE id_reporte = ?");
    $stmt->execute([$idReporte]);

    // Verificamos si realmente se borró alguna fila
    if ($stmt->rowCount() > 0) {
        $respuesta['success'] = true;
        $respuesta['data']['mensaje'] = "Reporte eliminado de la base de datos de forma permanente.";
    } else {
        http_response_code(404);
        $respuesta['errores']['bd'] = "No se encontro el reporte (puede que ya haya sido eliminado).";
    }

    echo json_encode($respuesta);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema al intentar borrar";
    echo json_encode($respuesta);
    exit;
}
?>