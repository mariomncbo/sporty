<?php
header('Content-Type: application/json');
require_once("../../../src/config/conexion.php");
session_start();

$respuesta = ['success' => false, 'errores' => []];

if (!isset($_SESSION["nickname"])) {
    http_response_code(401);
    $respuesta['errores']['auth'] = "Sesión no iniciada";
    echo json_encode($respuesta);
    exit;
}

$method = $_SERVER["REQUEST_METHOD"];

if ($method !== "GET") {
    http_response_code(405);
    $respuesta['errores']['metodo'] = "Método no permitido";
    echo json_encode($respuesta);
    exit;
}

try {
    // Datos del usuario en sesión (para el aside)
    $stmtMe = $_conexion->prepare(
        "SELECT name, nickname, foto_perfil FROM usuarios WHERE nickname = :nickname LIMIT 1"
    );
    $stmtMe->bindValue(':nickname', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmtMe->execute();
    $me = $stmtMe->fetch(PDO::FETCH_ASSOC);

    // ── Búsqueda de usuarios ──────────────────────────────────────────────────
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';

    if ($q !== '') {
        if (mb_strlen($q) > 50) {
            http_response_code(400);
            $respuesta['errores']['q'] = "Búsqueda demasiado larga";
            echo json_encode($respuesta);
            exit;
        }

        $like = '%' . $q . '%';
        $stmt = $_conexion->prepare(
            "SELECT nickname, name, foto_perfil, verificado, entrenador,
                    (SELECT COUNT(*) FROM seguidores WHERE id_seguido = id_usuario) AS seguidores
             FROM usuarios
             WHERE baneado = 0
               AND nickname != :me
               AND (nickname LIKE :q1 OR name LIKE :q2)
             ORDER BY seguidores DESC, nickname ASC
             LIMIT 20"
        );
        $stmt->bindValue(':me', $_SESSION["nickname"], PDO::PARAM_STR);
        $stmt->bindValue(':q1', $like, PDO::PARAM_STR);
        $stmt->bindValue(':q2', $like, PDO::PARAM_STR);
        $stmt->execute();
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $respuesta['success']  = true;
        $respuesta['modo']     = 'busqueda';
        $respuesta['yo']       = $me;
        $respuesta['usuarios'] = $usuarios;
        echo json_encode($respuesta);
        exit;
    }

    // ── Deporte filtro ────────────────────────────────────────────────────────
    $deporte = isset($_GET['deporte']) ? (int) $_GET['deporte'] : 0;

    if ($deporte > 0) {
        $stmt = $_conexion->prepare(
            "SELECT u.nickname, u.name, u.foto_perfil, u.verificado, u.entrenador,
                    d.nombre_deporte,
                    (SELECT COUNT(*) FROM seguidores WHERE id_seguido = u.id_usuario) AS seguidores
             FROM usuarios u
             LEFT JOIN deportes d ON d.id_deporte = u.deporte_favorito
             WHERE u.baneado = 0
               AND u.nickname != :me
               AND u.deporte_favorito = :deporte
             ORDER BY seguidores DESC, u.nickname ASC
             LIMIT 30"
        );
        $stmt->bindValue(':me',      $_SESSION["nickname"], PDO::PARAM_STR);
        $stmt->bindValue(':deporte', $deporte,              PDO::PARAM_INT);
        $stmt->execute();
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Nombre del deporte
        $stmtD = $_conexion->prepare("SELECT nombre_deporte FROM deportes WHERE id_deporte = :id LIMIT 1");
        $stmtD->bindValue(':id', $deporte, PDO::PARAM_INT);
        $stmtD->execute();
        $deporteRow = $stmtD->fetch(PDO::FETCH_ASSOC);

        $respuesta['success']        = true;
        $respuesta['modo']           = 'deporte';
        $respuesta['yo']             = $me;
        $respuesta['usuarios']       = $usuarios;
        $respuesta['nombre_deporte'] = $deporteRow ? $deporteRow['nombre_deporte'] : '';
        echo json_encode($respuesta);
        exit;
    }

    // ── Vista por defecto: categorías + sugerencias ───────────────────────────

    // Deportes con cantidad de atletas
    $stmtDep = $_conexion->query(
        "SELECT d.id_deporte, d.nombre_deporte,
                COUNT(u.id_usuario) AS total_atletas
         FROM deportes d
         LEFT JOIN usuarios u ON u.deporte_favorito = d.id_deporte AND u.baneado = 0
         GROUP BY d.id_deporte, d.nombre_deporte
         ORDER BY total_atletas DESC"
    );
    $categorias = $stmtDep->fetchAll(PDO::FETCH_ASSOC);

    // Sugerencias: usuarios que el usuario en sesión NO sigue, ordenados por seguidores
    $stmtSug = $_conexion->prepare(
        "SELECT u.nickname, u.name, u.foto_perfil, u.verificado, u.entrenador,
                d.nombre_deporte AS deporte,
                (SELECT COUNT(*) FROM seguidores WHERE id_seguido = u.id_usuario) AS seguidores
         FROM usuarios u
         LEFT JOIN deportes d ON d.id_deporte = u.deporte_favorito
         WHERE u.baneado = 0
           AND u.nickname != :me
           AND u.id_usuario NOT IN (
               SELECT id_seguido FROM seguidores
               WHERE id_seguidor = (SELECT id_usuario FROM usuarios WHERE nickname = :me2 LIMIT 1)
           )
         ORDER BY seguidores DESC, u.fecha_registro DESC
         LIMIT 24"
    );
    $stmtSug->bindValue(':me',  $_SESSION["nickname"], PDO::PARAM_STR);
    $stmtSug->bindValue(':me2', $_SESSION["nickname"], PDO::PARAM_STR);
    $stmtSug->execute();
    $sugerencias = $stmtSug->fetchAll(PDO::FETCH_ASSOC);

    $respuesta['success']     = true;
    $respuesta['modo']        = 'inicio';
    $respuesta['yo']          = $me;
    $respuesta['categorias']  = $categorias;
    $respuesta['sugerencias'] = $sugerencias;
    echo json_encode($respuesta);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    $respuesta['errores']['general'] = "Error del sistema";
    echo json_encode($respuesta);
    exit;
}
?>
