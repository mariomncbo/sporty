<?php
header('Content-Type: application/json');
require_once('../../../src/config/conexion.php');
session_start();

$respuesta = ['success' => false, 'errores' => []];

if (!isset($_SESSION['nickname'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

// Obtener id del usuario
$stmtMe = $_conexion->prepare('SELECT id_usuario FROM usuarios WHERE nickname = ? LIMIT 1');
$stmtMe->execute([$_SESSION['nickname']]);
$me = $stmtMe->fetch(PDO::FETCH_ASSOC);
if (!$me) { http_response_code(401); echo json_encode(['success' => false]); exit; }
$miId = (int) $me['id_usuario'];

$method = $_SERVER['REQUEST_METHOD'];

// ── Helper: verificar que la rutina pertenece al usuario ─────────────────────
function verificarRutina($pdo, $id_rutina, $id_usuario) {
    $s = $pdo->prepare('SELECT id_rutina FROM rutinas WHERE id_rutina = ? AND id_usuario = ? LIMIT 1');
    $s->execute([$id_rutina, $id_usuario]);
    return (bool) $s->fetch();
}

// ── GET — listar ejercicios de una rutina ─────────────────────────────────────
if ($method === 'GET') {
    $id_rutina = isset($_GET['id_rutina']) ? (int) $_GET['id_rutina'] : 0;
    if (!$id_rutina) {
        http_response_code(400);
        echo json_encode(['success' => false]);
        exit;
    }
    // Verificar que la rutina existe (no requiere ser el dueño — visible para todos)
    $chk = $_conexion->prepare('SELECT id_rutina FROM rutinas WHERE id_rutina = ? LIMIT 1');
    $chk->execute([$id_rutina]);
    if (!$chk->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false]);
        exit;
    }
    $stmt = $_conexion->prepare(
        'SELECT id, id_rutina, nombre, series, repeticiones, peso_kg, orden
         FROM rutina_ejercicios WHERE id_rutina = ? ORDER BY orden ASC, id ASC'
    );
    $stmt->execute([$id_rutina]);
    echo json_encode(['success' => true, 'ejercicios' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// ── POST — añadir ejercicio ───────────────────────────────────────────────────
if ($method === 'POST') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $id_rutina = (int)($body['id_rutina'] ?? 0);
    $nombre    = mb_substr(trim($body['nombre'] ?? ''), 0, 150);
    $series    = max(1, min(99, (int)($body['series'] ?? 3)));
    $reps      = max(1, min(99, (int)($body['repeticiones'] ?? 10)));
    $peso      = isset($body['peso_kg']) && $body['peso_kg'] !== '' ? round((float)$body['peso_kg'], 1) : null;

    if (!$id_rutina || !$nombre) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    if (!verificarRutina($_conexion, $id_rutina, $miId)) {
        http_response_code(403);
        echo json_encode(['success' => false]);
        exit;
    }

    // Calcular siguiente orden
    $stmtOrd = $_conexion->prepare('SELECT COALESCE(MAX(orden), -1) + 1 FROM rutina_ejercicios WHERE id_rutina = ?');
    $stmtOrd->execute([$id_rutina]);
    $orden = (int) $stmtOrd->fetchColumn();

    $stmt = $_conexion->prepare(
        'INSERT INTO rutina_ejercicios (id_rutina, nombre, series, repeticiones, peso_kg, orden)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$id_rutina, $nombre, $series, $reps, $peso, $orden]);

    echo json_encode([
        'success'    => true,
        'ejercicio'  => [
            'id'           => (int) $_conexion->lastInsertId(),
            'id_rutina'    => $id_rutina,
            'nombre'       => $nombre,
            'series'       => $series,
            'repeticiones' => $reps,
            'peso_kg'      => $peso,
            'orden'        => $orden,
        ],
    ]);
    exit;
}

// ── DELETE — eliminar ejercicio ───────────────────────────────────────────────
if ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['success' => false]); exit; }

    // Verificar que el ejercicio pertenece a una rutina del usuario
    $stmt = $_conexion->prepare(
        'SELECT re.id FROM rutina_ejercicios re
         JOIN rutinas r ON r.id_rutina = re.id_rutina
         WHERE re.id = ? AND r.id_usuario = ?'
    );
    $stmt->execute([$id, $miId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false]);
        exit;
    }

    $_conexion->prepare('DELETE FROM rutina_ejercicios WHERE id = ?')->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false]);
