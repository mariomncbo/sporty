<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
session_start();

$respuesta = ['success' => false, 'errores' => []];

if (!isset($_SESSION['nickname'])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = 'Sesión no iniciada';
    echo json_encode($respuesta);
    exit;
}

$id_post = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($id_post <= 0) {
    http_response_code(400);
    $respuesta['errores']['id'] = 'ID de post no válido';
    echo json_encode($respuesta);
    exit;
}

// ── GET — Detalle del post + comentarios ──────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Post con datos del autor
        $stmt = $_conexion->prepare("
            SELECT
                p.id_post,
                p.contenido,
                p.imagen,
                p.fecha,
                u.nickname,
                u.name,
                u.foto_perfil,
                u.verificado
            FROM posts p
            JOIN usuarios u ON u.id_usuario = p.id_autor
            WHERE p.id_post = :id_post
            LIMIT 1
        ");
        $stmt->bindValue(':id_post', $id_post, PDO::PARAM_INT);
        $stmt->execute();
        $post = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$post) {
            http_response_code(404);
            $respuesta['errores']['post'] = 'Post no encontrado';
            echo json_encode($respuesta);
            exit;
        }

        // Comentarios del post
        $stmtC = $_conexion->prepare("
            SELECT
                c.id_comentario,
                c.contenido,
                c.fecha,
                u.nickname,
                u.name,
                u.foto_perfil
            FROM comentarios c
            JOIN usuarios u ON u.id_usuario = c.id_autor
            WHERE c.id_post = :id_post
            ORDER BY c.fecha ASC
        ");
        $stmtC->bindValue(':id_post', $id_post, PDO::PARAM_INT);
        $stmtC->execute();
        $comentarios = $stmtC->fetchAll(PDO::FETCH_ASSOC);

        $respuesta['success']     = true;
        $respuesta['post']        = $post;
        $respuesta['comentarios'] = $comentarios;

        echo json_encode($respuesta);
        exit;

    } catch (PDOException $e) {
        http_response_code(500);
        $respuesta['errores']['general'] = 'Error del sistema';
        echo json_encode($respuesta);
        exit;
    }
}

// ── POST — Añadir comentario ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $contenido = isset($input['contenido']) ? mb_substr(trim($input['contenido']), 0, 500) : '';

    if ($contenido === '') {
        http_response_code(400);
        $respuesta['errores']['contenido'] = 'El comentario no puede estar vacío';
        echo json_encode($respuesta);
        exit;
    }

    try {
        // Obtener id del usuario de sesión
        $stmtU = $_conexion->prepare('SELECT id_usuario, name, nickname, foto_perfil FROM usuarios WHERE nickname = :nickname LIMIT 1');
        $stmtU->bindValue(':nickname', $_SESSION['nickname'], PDO::PARAM_STR);
        $stmtU->execute();
        $usuario = $stmtU->fetch(PDO::FETCH_ASSOC);

        if (!$usuario) {
            http_response_code(401);
            $respuesta['errores']['auth'] = 'Usuario no encontrado';
            echo json_encode($respuesta);
            exit;
        }

        // Verificar que el post existe
        $stmtP = $_conexion->prepare('SELECT id_post FROM posts WHERE id_post = :id LIMIT 1');
        $stmtP->bindValue(':id', $id_post, PDO::PARAM_INT);
        $stmtP->execute();
        if (!$stmtP->fetch()) {
            http_response_code(404);
            $respuesta['errores']['post'] = 'Post no encontrado';
            echo json_encode($respuesta);
            exit;
        }

        $stmtIns = $_conexion->prepare('INSERT INTO comentarios (id_post, id_autor, contenido) VALUES (:id_post, :id_autor, :contenido)');
        $stmtIns->bindValue(':id_post',   $id_post,                          PDO::PARAM_INT);
        $stmtIns->bindValue(':id_autor',  (int) $usuario['id_usuario'],      PDO::PARAM_INT);
        $stmtIns->bindValue(':contenido', $contenido,                         PDO::PARAM_STR);
        $stmtIns->execute();

        // Notificación al autor del post (si es distinto de quien comenta)
        $stmtAutor = $_conexion->prepare('SELECT id_autor FROM posts WHERE id_post = ? LIMIT 1');
        $stmtAutor->execute([$id_post]);
        $postAutor = $stmtAutor->fetchColumn();
        if ($postAutor && (int)$postAutor !== (int)$usuario['id_usuario']) {
            $_conexion->prepare("
                INSERT INTO notificaciones (id_destinatario, id_emisor, tipo, id_referencia)
                VALUES (?, ?, 'nuevo_comentario', ?)
            ")->execute([$postAutor, $usuario['id_usuario'], $id_post]);
        }

        $respuesta['success']    = true;
        $respuesta['comentario'] = [
            'id_comentario' => (int) $_conexion->lastInsertId(),
            'contenido'     => $contenido,
            'fecha'         => date('Y-m-d H:i:s'),
            'nickname'      => $usuario['nickname'],
            'name'          => $usuario['name'],
            'foto_perfil'   => $usuario['foto_perfil'],
        ];

        echo json_encode($respuesta);
        exit;

    } catch (PDOException $e) {
        http_response_code(500);
        $respuesta['errores']['general'] = 'Error del sistema';
        echo json_encode($respuesta);
        exit;
    }
}

// ── DELETE — Borrar post o comentario ────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $tipo  = $input['tipo'] ?? '';

    $stmtU = $_conexion->prepare('SELECT id_usuario FROM usuarios WHERE nickname = :nick LIMIT 1');
    $stmtU->bindValue(':nick', $_SESSION['nickname'], PDO::PARAM_STR);
    $stmtU->execute();
    $me = $stmtU->fetch(PDO::FETCH_ASSOC);
    if (!$me) { http_response_code(401); echo json_encode(['success' => false]); exit; }
    $miId = (int) $me['id_usuario'];

    if ($tipo === 'post') {
        $stmt = $_conexion->prepare('DELETE FROM posts WHERE id_post = :id AND id_autor = :autor');
        $stmt->bindValue(':id',    $id_post, PDO::PARAM_INT);
        $stmt->bindValue(':autor', $miId,    PDO::PARAM_INT);
        $stmt->execute();
        echo json_encode(['success' => $stmt->rowCount() > 0]);
        exit;
    }

    if ($tipo === 'comentario') {
        $idComentario = (int)($input['id_comentario'] ?? 0);
        if ($idComentario <= 0) { http_response_code(400); echo json_encode(['success' => false]); exit; }

        // Puede borrar si: es el autor del comentario O es el dueño del post
        $stmtPost = $_conexion->prepare('SELECT id_autor FROM posts WHERE id_post = ? LIMIT 1');
        $stmtPost->execute([$id_post]);
        $postAutorId = (int) $stmtPost->fetchColumn();

        if ($miId === $postAutorId) {
            $stmt = $_conexion->prepare('DELETE FROM comentarios WHERE id_comentario = ? AND id_post = ?');
            $stmt->execute([$idComentario, $id_post]);
        } else {
            $stmt = $_conexion->prepare('DELETE FROM comentarios WHERE id_comentario = ? AND id_autor = ?');
            $stmt->execute([$idComentario, $miId]);
        }
        echo json_encode(['success' => $stmt->rowCount() > 0]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false]);
    exit;
}

http_response_code(405);
$respuesta['errores']['metodo'] = 'Método no permitido';
echo json_encode($respuesta);
