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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    $respuesta['errores']['metodo'] = 'Método no permitido';
    echo json_encode($respuesta);
    exit;
}

try {
    // ── Usuario en sesión ─────────────────────────────────────────────────────
    $stmtMe = $_conexion->prepare(
        "SELECT id_usuario, name, nickname, foto_perfil
         FROM usuarios WHERE nickname = :nick LIMIT 1"
    );
    $stmtMe->bindValue(':nick', $_SESSION['nickname'], PDO::PARAM_STR);
    $stmtMe->execute();
    $me = $stmtMe->fetch(PDO::FETCH_ASSOC);

    if (!$me) {
        http_response_code(401);
        $respuesta['errores']['auth'] = 'Usuario no encontrado';
        echo json_encode($respuesta);
        exit;
    }
    $id_me = (int) $me['id_usuario'];

    // ── Posts del feed (seguidos + propios) ───────────────────────────────────
    $stmtPosts = $_conexion->prepare("
        SELECT
            p.id_post,
            p.contenido,
            p.imagen,
            p.fecha,
            u.nickname,
            u.name,
            u.foto_perfil,
            u.verificado,
            (SELECT COUNT(*) FROM comentarios c WHERE c.id_post = p.id_post) AS total_comentarios,
            (SELECT COUNT(*) FROM posts_guardados pg WHERE pg.id_post = p.id_post AND pg.id_usuario = :id_me3) AS yo_lo_guarde
        FROM posts p
        JOIN usuarios u ON u.id_usuario = p.id_autor
        WHERE p.imagen IS NOT NULL
          AND (
            p.id_autor = :id_me
            OR p.id_autor IN (
                SELECT id_seguido FROM seguidores WHERE id_seguidor = :id_me2
            )
          )
          AND u.baneado = 0
        ORDER BY p.fecha DESC
        LIMIT 50
    ");
    $stmtPosts->bindValue(':id_me',  $id_me, PDO::PARAM_INT);
    $stmtPosts->bindValue(':id_me2', $id_me, PDO::PARAM_INT);
    $stmtPosts->bindValue(':id_me3', $id_me, PDO::PARAM_INT);
    $stmtPosts->execute();
    $posts = $stmtPosts->fetchAll(PDO::FETCH_ASSOC);

    // ── Historias activas de seguidos ─────────────────────────────────────────
    $stmtHistorias = $_conexion->prepare("
        SELECT
            h.id_historia,
            h.imagen,
            h.fecha,
            u.nickname,
            u.name,
            u.foto_perfil
        FROM historias h
        JOIN usuarios u ON u.id_usuario = h.id_autor
        WHERE h.expira_en > NOW()
          AND (
            h.id_autor = :id_me
            OR h.id_autor IN (
                SELECT id_seguido FROM seguidores WHERE id_seguidor = :id_me2
            )
          )
          AND u.baneado = 0
        ORDER BY h.fecha DESC
    ");
    $stmtHistorias->bindValue(':id_me',  $id_me, PDO::PARAM_INT);
    $stmtHistorias->bindValue(':id_me2', $id_me, PDO::PARAM_INT);
    $stmtHistorias->execute();
    $historias = $stmtHistorias->fetchAll(PDO::FETCH_ASSOC);

    // Agrupar todas las historias por usuario (orden: usuario con historia más reciente primero)
    $historiasAgrupadas = [];
    foreach ($historias as $h) {
        $nick = $h['nickname'];
        if (!isset($historiasAgrupadas[$nick])) {
            $historiasAgrupadas[$nick] = [
                'nickname'    => $h['nickname'],
                'name'        => $h['name'],
                'foto_perfil' => $h['foto_perfil'],
                'historias'   => [],
            ];
        }
        $historiasAgrupadas[$nick]['historias'][] = [
            'id_historia' => (int) $h['id_historia'],
            'imagen'      => $h['imagen'],
            'fecha'       => $h['fecha'],
        ];
    }
    // Las historias de cada usuario llegan DESC; las invertimos para verlas cronológicamente
    foreach ($historiasAgrupadas as &$grupo) {
        $grupo['historias'] = array_reverse($grupo['historias']);
    }
    unset($grupo);
    $historiasAgrupadas = array_values($historiasAgrupadas);

    // ── Sugerencias (usuarios no seguidos, no baneados) ───────────────────────
    $stmtSug = $_conexion->prepare("
        SELECT u.id_usuario, u.nickname, u.name, u.foto_perfil, u.verificado, u.entrenador,
               d.nombre_deporte
        FROM usuarios u
        LEFT JOIN deportes d ON d.id_deporte = u.deporte_favorito
        WHERE u.baneado = 0
          AND u.id_usuario != :id_me
          AND u.id_usuario NOT IN (
              SELECT id_seguido FROM seguidores WHERE id_seguidor = :id_me2
          )
        ORDER BY RAND()
        LIMIT 5
    ");
    $stmtSug->bindValue(':id_me',  $id_me, PDO::PARAM_INT);
    $stmtSug->bindValue(':id_me2', $id_me, PDO::PARAM_INT);
    $stmtSug->execute();
    $sugerencias = $stmtSug->fetchAll(PDO::FETCH_ASSOC);

    $respuesta['success']    = true;
    $respuesta['yo']         = $me;
    $respuesta['posts']      = $posts;
    $respuesta['historias']  = $historiasAgrupadas;
    $respuesta['sugerencias'] = $sugerencias;

    echo json_encode($respuesta);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = 'Error del sistema';
    echo json_encode($respuesta);
    exit;
}
