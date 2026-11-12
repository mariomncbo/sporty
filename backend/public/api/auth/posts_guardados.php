<?php
header('Content-Type: application/json');
require_once('../../../src/config/conexion.php');
session_start();

if (!isset($_SESSION['nickname'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

$stmtMe = $_conexion->prepare('SELECT id_usuario FROM usuarios WHERE nickname = ? LIMIT 1');
$stmtMe->execute([$_SESSION['nickname']]);
$me = $stmtMe->fetch(PDO::FETCH_ASSOC);
if (!$me) { http_response_code(401); echo json_encode(['success' => false]); exit; }
$miId = (int) $me['id_usuario'];

$method = $_SERVER['REQUEST_METHOD'];

// ── GET — lista de posts guardados ────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $_conexion->prepare(
        "SELECT p.id_post, p.imagen, p.contenido, p.fecha,
                u.nickname, u.name, u.foto_perfil
         FROM posts_guardados pg
         JOIN posts    p ON p.id_post    = pg.id_post
         JOIN usuarios u ON u.id_usuario = p.id_autor
         WHERE pg.id_usuario = ?
         ORDER BY pg.fecha DESC"
    );
    $stmt->execute([$miId]);
    echo json_encode(['success' => true, 'posts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// ── POST — toggle guardar/desguardar ──────────────────────────────────────────
if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $id_post = (int)($body['id_post'] ?? 0);
    if (!$id_post) { http_response_code(400); echo json_encode(['success' => false]); exit; }

    // Verificar que el post existe
    $chk = $_conexion->prepare('SELECT id_post FROM posts WHERE id_post = ? LIMIT 1');
    $chk->execute([$id_post]);
    if (!$chk->fetch()) { http_response_code(404); echo json_encode(['success' => false]); exit; }

    $chkG = $_conexion->prepare('SELECT id FROM posts_guardados WHERE id_post = ? AND id_usuario = ? LIMIT 1');
    $chkG->execute([$id_post, $miId]);
    if ($chkG->fetch()) {
        // Ya guardado → quitar
        $_conexion->prepare('DELETE FROM posts_guardados WHERE id_post = ? AND id_usuario = ?')
                  ->execute([$id_post, $miId]);
        echo json_encode(['success' => true, 'guardado' => false]);
    } else {
        // No guardado → guardar
        $_conexion->prepare('INSERT INTO posts_guardados (id_post, id_usuario) VALUES (?, ?)')
                  ->execute([$id_post, $miId]);
        echo json_encode(['success' => true, 'guardado' => true]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false]);
