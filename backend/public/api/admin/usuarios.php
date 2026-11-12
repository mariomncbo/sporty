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


try{
    // Expirar baneos temporales que ya vencieron
    $_conexion->query("
        UPDATE usuarios u
        INNER JOIN baneos b ON b.id_usuario = u.id_usuario
        SET u.baneado = 0, b.activo = 0
        WHERE b.activo = 1 AND b.tipo = 'temporal' AND b.fecha_fin IS NOT NULL AND b.fecha_fin < NOW()
    ");

    $stmtUsuarios = $_conexion->query("
        SELECT
            u.id_usuario, u.name, u.nickname, u.email,
            u.admin, u.entrenador, u.baneado, u.verificado,
            u.foto_perfil, u.fecha_registro,
            d.nombre_deporte AS deporte_favorito,
            COUNT(DISTINCT s1.id) AS total_seguidores,
            COUNT(DISTINCT s2.id) AS total_seguidos,
            COUNT(DISTINCT p.id_post) AS total_posts,
            b.tipo AS tipo_baneo,
            b.fecha_fin AS fecha_fin_baneo,
            b.motivo AS motivo_baneo
        FROM usuarios u
        LEFT JOIN deportes d ON u.deporte_favorito = d.id_deporte
        LEFT JOIN seguidores s1 ON s1.id_seguido = u.id_usuario
        LEFT JOIN seguidores s2 ON s2.id_seguidor = u.id_usuario
        LEFT JOIN posts p ON p.id_autor = u.id_usuario
        LEFT JOIN baneos b ON b.id_usuario = u.id_usuario AND b.activo = 1
        GROUP BY u.id_usuario, b.tipo, b.fecha_fin, b.motivo
        ORDER BY u.fecha_registro DESC
    ");
    $usuarios = $stmtUsuarios->fetchAll(PDO::FETCH_ASSOC);

    $respuesta['success'] = true;
    $respuesta['data'] = [
        'usuarios' => $usuarios
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