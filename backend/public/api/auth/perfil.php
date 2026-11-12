<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
session_start();

$respuesta = [
    'success' => false,
    'usuario' => null,
    'posts'   => [],
    'errores' => []
];

if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = "Sesión no iniciada";
    echo json_encode($respuesta);
    exit;
}

$method = $_SERVER["REQUEST_METHOD"];

if (!in_array($method, ['GET', 'DELETE'], true)) {
    http_response_code(405);
    $respuesta['errores']['metodo'] = "Método no permitido";
    echo json_encode($respuesta);
    exit;
}

// ── DELETE — Eliminar seguidor o dejar de seguir ─────────────────────────────
if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    try {
        $stmtMe2 = $_conexion->prepare("SELECT id_usuario FROM usuarios WHERE nickname = :nick LIMIT 1");
        $stmtMe2->bindValue(':nick', $_SESSION["nickname"], PDO::PARAM_STR);
        $stmtMe2->execute();
        $me2 = $stmtMe2->fetch(PDO::FETCH_ASSOC);
        if (!$me2) { http_response_code(401); echo json_encode(['success' => false]); exit; }
        $id_me = (int) $me2['id_usuario'];

        $body     = json_decode(file_get_contents('php://input'), true);
        $tipo     = isset($body['tipo'])       ? $body['tipo']            : '';
        $id_otro  = isset($body['id_usuario']) ? (int) $body['id_usuario'] : 0;

        if (!in_array($tipo, ['seguidor', 'seguido'], true) || $id_otro <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errores' => ['params' => 'Parámetros inválidos']]);
            exit;
        }

        if ($tipo === 'seguidor') {
            // Eliminar a alguien de mis seguidores (él me sigue, yo lo quito)
            $stmt = $_conexion->prepare("DELETE FROM seguidores WHERE id_seguidor = :otro AND id_seguido = :me");
        } else {
            // Dejar de seguir a alguien (yo le sigo, dejo de hacerlo)
            $stmt = $_conexion->prepare("DELETE FROM seguidores WHERE id_seguidor = :me AND id_seguido = :otro");
        }
        $stmt->bindValue(':me',   $id_me,  PDO::PARAM_INT);
        $stmt->bindValue(':otro', $id_otro, PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode(['success' => true]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false]);
        exit;
    }
}

// ── GET ?lista= — Lista de seguidores o seguidos ──────────────────────────────
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET['lista'])) {
    $lista = $_GET['lista'];
    if (!in_array($lista, ['seguidores', 'seguidos'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false]);
        exit;
    }
    try {
        $stmtMe3 = $_conexion->prepare("SELECT id_usuario FROM usuarios WHERE nickname = :nick LIMIT 1");
        $stmtMe3->bindValue(':nick', $_SESSION["nickname"], PDO::PARAM_STR);
        $stmtMe3->execute();
        $me3 = $stmtMe3->fetch(PDO::FETCH_ASSOC);
        if (!$me3) { http_response_code(401); echo json_encode(['success' => false]); exit; }
        $id_me = (int) $me3['id_usuario'];

        if ($lista === 'seguidores') {
            // Gente que me sigue a mí
            $stmt = $_conexion->prepare("
                SELECT u.id_usuario, u.name, u.nickname, u.foto_perfil, u.verificado
                FROM seguidores s
                JOIN usuarios u ON u.id_usuario = s.id_seguidor
                WHERE s.id_seguido = :me AND u.baneado = 0 AND s.estado = 'aceptado'
                ORDER BY s.id DESC
            ");
        } else {
            // Gente a quien yo sigo
            $stmt = $_conexion->prepare("
                SELECT u.id_usuario, u.name, u.nickname, u.foto_perfil, u.verificado
                FROM seguidores s
                JOIN usuarios u ON u.id_usuario = s.id_seguido
                WHERE s.id_seguidor = :me AND u.baneado = 0 AND s.estado = 'aceptado'
                ORDER BY s.id DESC
            ");
        }
        $stmt->bindValue(':me', $id_me, PDO::PARAM_INT);
        $stmt->execute();
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'usuarios' => $usuarios]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false]);
        exit;
    }
}

try {
    // Datos del usuario con contadores de seguidores, seguidos y posts
    $stmt = $_conexion->prepare("
        SELECT
            u.id_usuario,
            u.name,
            u.nickname,
            u.foto_perfil,
            u.verificado,
            u.entrenador,
            u.bio,
            u.website,
            (SELECT COUNT(*) FROM seguidores WHERE id_seguido  = u.id_usuario AND estado = 'aceptado') AS total_seguidores,
            (SELECT COUNT(*) FROM seguidores WHERE id_seguidor = u.id_usuario AND estado = 'aceptado') AS total_seguidos,
            (SELECT COUNT(*) FROM posts      WHERE id_autor    = u.id_usuario) AS total_posts
        FROM usuarios u
        WHERE u.nickname = :nickname
        LIMIT 1
    ");
    $stmt->bindValue(':nickname', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmt->execute();
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(404);
        $respuesta['errores']['usuario'] = "Usuario no encontrado";
        echo json_encode($respuesta);
        exit;
    }

    // Publicaciones del usuario ordenadas por fecha
    $stmtPosts = $_conexion->prepare("
        SELECT id_post, contenido, imagen, fecha
        FROM posts
        WHERE id_autor = :id_autor
        ORDER BY fecha DESC
    ");
    $stmtPosts->bindValue(':id_autor', (int) $usuario['id_usuario'], PDO::PARAM_INT);
    $stmtPosts->execute();
    $posts = $stmtPosts->fetchAll(PDO::FETCH_ASSOC);

    // Historias activas del usuario
    $stmtHist = $_conexion->prepare("
        SELECT id_historia, imagen, fecha
        FROM historias
        WHERE id_autor = :id AND expira_en > NOW()
        ORDER BY fecha ASC
    ");
    $stmtHist->bindValue(':id', (int) $usuario['id_usuario'], PDO::PARAM_INT);
    $stmtHist->execute();
    $historias = $stmtHist->fetchAll(PDO::FETCH_ASSOC);

    $respuesta['success']   = true;
    $respuesta['usuario']   = $usuario;
    $respuesta['posts']     = $posts;
    $respuesta['historias'] = $historias;

    echo json_encode($respuesta);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema";
    echo json_encode($respuesta);
    exit;
}
?>
