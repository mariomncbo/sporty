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

if (!isset($_SESSION["admin"]) || (int)$_SESSION["admin"] !== 1) {
    http_response_code(403);
    $respuesta['errores']['auth'] = "No tienes permisos de administrador";
    echo json_encode($respuesta);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id_usuario']) || !isset($input['accion'])) {
    http_response_code(400);
    $respuesta['errores']['input'] = "Datos incompletos";
    echo json_encode($respuesta);
    exit;
}

$idUsuario = (int)$input['id_usuario'];
$accion    = $input['accion'];

if ($idUsuario <= 0) {
    http_response_code(400);
    $respuesta['errores']['id'] = "ID de usuario invalido";
    echo json_encode($respuesta);
    exit;
}

try {
    // Obtener id del admin activo
    $stmtAdmin = $_conexion->prepare("SELECT id_usuario FROM usuarios WHERE nickname = ?");
    $stmtAdmin->execute([$_SESSION['nickname']]);
    $admin = $stmtAdmin->fetch();
    $idAdmin = $admin ? (int)$admin['id_usuario'] : null;

    // No permitir auto-baneo
    if ($idAdmin !== null && $idAdmin === $idUsuario) {
        http_response_code(400);
        $respuesta['errores']['accion'] = "No puedes banearte a ti mismo";
        echo json_encode($respuesta);
        exit;
    }

    // Verificar que el usuario objetivo existe y no es admin
    $stmtCheck = $_conexion->prepare("SELECT id_usuario, admin FROM usuarios WHERE id_usuario = ?");
    $stmtCheck->execute([$idUsuario]);
    $objetivo = $stmtCheck->fetch();

    if (!$objetivo) {
        http_response_code(404);
        $respuesta['errores']['usuario'] = "Usuario no encontrado";
        echo json_encode($respuesta);
        exit;
    }

    if ((int)$objetivo['admin'] === 1) {
        http_response_code(403);
        $respuesta['errores']['accion'] = "No puedes banear a otro administrador";
        echo json_encode($respuesta);
        exit;
    }

    if ($accion === 'desbanear') {
        $stmt = $_conexion->prepare("UPDATE usuarios SET baneado = 0 WHERE id_usuario = ?");
        $stmt->execute([$idUsuario]);

        $stmt2 = $_conexion->prepare("UPDATE baneos SET activo = 0 WHERE id_usuario = ? AND activo = 1");
        $stmt2->execute([$idUsuario]);

        $respuesta['success'] = true;
        $respuesta['data']['mensaje'] = "Usuario desbaneado correctamente";

    } elseif ($accion === 'banear') {
        $tipo     = isset($input['tipo']) ? $input['tipo'] : 'permanente';
        $duracion = isset($input['duracion']) ? (int)$input['duracion'] : null;
        $motivo   = isset($input['motivo']) ? trim((string)$input['motivo']) : '';

        if (!in_array($tipo, ['permanente', 'temporal'])) {
            http_response_code(400);
            $respuesta['errores']['tipo'] = "Tipo de baneo invalido";
            echo json_encode($respuesta);
            exit;
        }

        if ($tipo === 'temporal' && (!$duracion || $duracion <= 0)) {
            http_response_code(400);
            $respuesta['errores']['duracion'] = "Duracion invalida para baneo temporal";
            echo json_encode($respuesta);
            exit;
        }

        if ($motivo === '' || mb_strlen($motivo) < 3) {
            http_response_code(400);
            $respuesta['errores']['motivo'] = "Debes indicar un motivo valido (minimo 3 caracteres)";
            echo json_encode($respuesta);
            exit;
        }

        if (mb_strlen($motivo) > 255) {
            http_response_code(400);
            $respuesta['errores']['motivo'] = "El motivo no puede superar 255 caracteres";
            echo json_encode($respuesta);
            exit;
        }

        $fechaFin = null;
        if ($tipo === 'temporal') {
            $fechaFin = date('Y-m-d H:i:s', strtotime("+{$duracion} days"));
        }

        // Desactivar baneos anteriores activos
        $stmt = $_conexion->prepare("UPDATE baneos SET activo = 0 WHERE id_usuario = ? AND activo = 1");
        $stmt->execute([$idUsuario]);

        // Marcar usuario como baneado
        $stmt2 = $_conexion->prepare("UPDATE usuarios SET baneado = 1 WHERE id_usuario = ?");
        $stmt2->execute([$idUsuario]);

        // Registrar en historial de baneos
        $stmt3 = $_conexion->prepare("INSERT INTO baneos (id_usuario, id_admin, tipo, motivo, fecha_fin) VALUES (?, ?, ?, ?, ?)");
        $stmt3->execute([$idUsuario, $idAdmin, $tipo, $motivo, $fechaFin]);

        $respuesta['success'] = true;
        $respuesta['data']['mensaje'] = "Usuario baneado correctamente";
        $respuesta['data']['fecha_fin'] = $fechaFin;
        $respuesta['data']['motivo'] = $motivo;

    } else {
        http_response_code(400);
        $respuesta['errores']['accion'] = "Accion no valida";
        echo json_encode($respuesta);
        exit;
    }

    echo json_encode($respuesta);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema";
    echo json_encode($respuesta);
    exit;
}
?>
