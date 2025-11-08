<?php
// api/dashboard/sliders.php - CRUD de Sliders

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';

checkAuth();

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'list') {
            getSliders();
        } elseif ($action === 'get' && isset($_GET['id'])) {
            getSlider($_GET['id']);
        }
        break;
    
    case 'POST':
        if ($action === 'create') {
            createSlider();
        }
        break;
    
    case 'PUT':
        if ($action === 'update' && isset($_GET['id'])) {
            updateSlider($_GET['id']);
        }
        break;
    
    case 'DELETE':
        if ($action === 'delete' && isset($_GET['id'])) {
            deleteSlider($_GET['id']);
        }
        break;
    
    default:
        sendJSON(['success' => false, 'message' => 'Método no permitido'], 405);
}

function getSliders() {
    global $db;
    
    $query = "SELECT * FROM sliders ORDER BY orden ASC, created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $sliders = $stmt->fetchAll();

    sendJSON([
        'success' => true,
        'sliders' => $sliders
    ]);
}

function getSlider($id) {
    global $db;
    
    $query = "SELECT * FROM sliders WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        sendJSON(['success' => false, 'message' => 'Slider no encontrado'], 404);
    }
    
    $slider = $stmt->fetch();
    
    sendJSON([
        'success' => true,
        'slider' => $slider
    ]);
}

function createSlider() {
    global $db;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['titulo']) || empty($data['imagen'])) {
        sendJSON([
            'success' => false,
            'message' => 'Título e imagen son obligatorios'
        ], 400);
    }
    
    $query = "INSERT INTO sliders (titulo, descripcion, imagen, enlace, orden, activo, tipo) 
              VALUES (:titulo, :descripcion, :imagen, :enlace, :orden, :activo, :tipo)";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':titulo', $data['titulo']);
    $stmt->bindParam(':descripcion', $data['descripcion']);
    $stmt->bindParam(':imagen', $data['imagen']);
    $stmt->bindParam(':enlace', $data['enlace']);
    $stmt->bindParam(':orden', $data['orden']);
    $activo = isset($data['activo']) ? 1 : 0;
    $stmt->bindParam(':activo', $activo);
    $stmt->bindParam(':tipo', $data['tipo']);
    
    if ($stmt->execute()) {
        $newId = $db->lastInsertId();
        
        sendJSON([
            'success' => true,
            'message' => 'Slider creado exitosamente',
            'id' => $newId
        ], 201);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al crear el slider'
        ], 500);
    }
}

function updateSlider($id) {
    global $db;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $query = "UPDATE sliders SET 
              titulo = :titulo,
              descripcion = :descripcion,
              imagen = :imagen,
              enlace = :enlace,
              orden = :orden,
              activo = :activo,
              tipo = :tipo
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':titulo', $data['titulo']);
    $stmt->bindParam(':descripcion', $data['descripcion']);
    $stmt->bindParam(':imagen', $data['imagen']);
    $stmt->bindParam(':enlace', $data['enlace']);
    $stmt->bindParam(':orden', $data['orden']);
    $activo = isset($data['activo']) ? 1 : 0;
    $stmt->bindParam(':activo', $activo);
    $stmt->bindParam(':tipo', $data['tipo']);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        sendJSON([
            'success' => true,
            'message' => 'Slider actualizado exitosamente'
        ]);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al actualizar el slider'
        ], 500);
    }
}

function deleteSlider($id) {
    global $db;
    
    $query = "DELETE FROM sliders WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            sendJSON([
                'success' => true,
                'message' => 'Slider eliminado exitosamente'
            ]);
        } else {
            sendJSON([
                'success' => false,
                'message' => 'Slider no encontrado'
            ], 404);
        }
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al eliminar el slider'
        ], 500);
    }
}
?>