<?php
// api/contenido.php - API Pública de Sliders y Anuncios

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method !== 'GET') {
    sendJSON(['success' => false, 'message' => 'Método no permitido'], 405);
}

switch ($action) {
    case 'sliders':
        getSliders();
        break;
    case 'anuncios':
        getAnuncios();
        break;
    default:
        sendJSON(['success' => false, 'message' => 'Acción no válida'], 400);
}

function getSliders() {
    global $db;
    
    $query = "SELECT id, titulo, descripcion, imagen, enlace, tipo 
              FROM sliders 
              WHERE activo = 1 
              ORDER BY orden ASC, created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $sliders = $stmt->fetchAll();

    sendJSON([
        'success' => true,
        'sliders' => $sliders
    ]);
}

function getAnuncios() {
    global $db;
    
    $today = date('Y-m-d');
    
    $query = "SELECT id, titulo, mensaje, tipo, imagen, duracion, color_fondo, color_texto 
              FROM anuncios 
              WHERE activo = 1 
              AND (fecha_inicio IS NULL OR fecha_inicio <= :today)
              AND (fecha_fin IS NULL OR fecha_fin >= :today)
              ORDER BY created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':today', $today);
    $stmt->execute();
    $anuncios = $stmt->fetchAll();

    sendJSON([
        'success' => true,
        'anuncios' => $anuncios
    ]);
}
?>