<?php
header('Content-Type: application/json');

require "../../../src/config/conexion.php";

session_start();

$respuesta = [
    'success' => false,
    'errores' => [],
    'data' => []
];

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
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
$tipo = isset($input['tipo']) ? strtolower(trim((string)$input['tipo'])) : '';
$id = isset($input['id']) ? (int)$input['id'] : 0;

if (!in_array($tipo, ['deporte', 'ejercicio'], true)) {
    http_response_code(400);
    $respuesta['errores']['tipo'] = "Tipo invalido";
    echo json_encode($respuesta);
    exit;
}

if ($id <= 0) {
    http_response_code(400);
    $respuesta['errores']['id'] = "ID invalido";
    echo json_encode($respuesta);
    exit;
}

try {
    $_conexion->beginTransaction();

    if ($tipo === 'deporte') {
        $stmtExiste = $_conexion->prepare("SELECT id_deporte FROM deportes WHERE id_deporte = ?");
        $stmtExiste->execute([$id]);

        if (!$stmtExiste->fetch()) {
            $_conexion->rollBack();
            http_response_code(404);
            $respuesta['errores']['deporte'] = "Deporte no encontrado";
            echo json_encode($respuesta);
            exit;
        }

        $stmtUso = $_conexion->prepare("SELECT COUNT(*) AS total FROM ejercicios WHERE id_deporte = ?");
        $stmtUso->execute([$id]);
        $uso = (int)$stmtUso->fetch()['total'];

        if ($uso > 0) {
            $_conexion->rollBack();
            http_response_code(409);
            $respuesta['errores']['deporte'] = "No puedes eliminar este deporte porque tiene ejercicios asociados";
            echo json_encode($respuesta);
            exit;
        }

        $stmtDelete = $_conexion->prepare("DELETE FROM deportes WHERE id_deporte = ?");
        $stmtDelete->execute([$id]);

        $_conexion->commit();
        $respuesta['success'] = true;
        $respuesta['data']['mensaje'] = "Deporte eliminado correctamente";
        echo json_encode($respuesta);
        exit;
    }

    $stmtExiste = $_conexion->prepare("SELECT id_ejercicio FROM ejercicios WHERE id_ejercicio = ?");
    $stmtExiste->execute([$id]);

    if (!$stmtExiste->fetch()) {
        $_conexion->rollBack();
        http_response_code(404);
        $respuesta['errores']['ejercicio'] = "Ejercicio no encontrado";
        echo json_encode($respuesta);
        exit;
    }

    $stmtDelete = $_conexion->prepare("DELETE FROM ejercicios WHERE id_ejercicio = ?");
    $stmtDelete->execute([$id]);

    $_conexion->commit();
    $respuesta['success'] = true;
    $respuesta['data']['mensaje'] = "Ejercicio eliminado correctamente";
    echo json_encode($respuesta);
    exit;
} catch (PDOException $e) {
    if ($_conexion->inTransaction()) {
        $_conexion->rollBack();
    }

    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema: " . $e->getMessage();
    echo json_encode($respuesta);
    exit;
}
?>
