<?php
// api/dashboard/anuncios.php - CRUD de Anuncios

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
            getAnuncios();
        } elseif ($action === 'get' && isset($_GET['id'])) {
            getAnuncio($_GET['id']);
        }
        break;
    
    case 'POST':
        if ($action === 'create') {
            createAnuncio();
        }
        break;
    
    case 'PUT':
        if ($action === 'update' && isset($_GET['id'])) {
            updateAnuncio($_GET['id']);
        }
        break;
    
    case 'DELETE':
        if ($action === 'delete' && isset($_GET['id'])) {
            deleteAnuncio($_GET['id']);
        }
        break;
    
    default:
        sendJSON(['success' => false, 'message' => 'Método no permitido'], 405);
}

function getAnuncios() {
    global $db;
    
    $query = "SELECT * FROM anuncios ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $anuncios = $stmt->fetchAll();

    sendJSON([
        'success' => true,
        'anuncios' => $anuncios
    ]);
}

function getAnuncio($id) {
    global $db;
    
    $query = "SELECT * FROM anuncios WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        sendJSON(['success' => false, 'message' => 'Anuncio no encontrado'], 404);
    }
    
    $anuncio = $stmt->fetch();
    
    sendJSON([
        'success' => true,
        'anuncio' => $anuncio
    ]);
}

function createAnuncio() {
    global $db;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['titulo']) || empty($data['mensaje'])) {
        sendJSON([
            'success' => false,
            'message' => 'Título y mensaje son obligatorios'
        ], 400);
    }
    
    $query = "INSERT INTO anuncios (titulo, mensaje, tipo, imagen, duracion, color_fondo, color_texto, activo, fecha_inicio, fecha_fin) 
              VALUES (:titulo, :mensaje, :tipo, :imagen, :duracion, :color_fondo, :color_texto, :activo, :fecha_inicio, :fecha_fin)";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':titulo', $data['titulo']);
    $stmt->bindParam(':mensaje', $data['mensaje']);
    $stmt->bindParam(':tipo', $data['tipo']);
    $stmt->bindParam(':imagen', $data['imagen']);
    $stmt->bindParam(':duracion', $data['duracion']);
    $stmt->bindParam(':color_fondo', $data['color_fondo']);
    $stmt->bindParam(':color_texto', $data['color_texto']);
    $activo = isset($data['activo']) ? 1 : 0;
    $stmt->bindParam(':activo', $activo);
    $stmt->bindParam(':fecha_inicio', $data['fecha_inicio']);
    $stmt->bindParam(':fecha_fin', $data['fecha_fin']);
    
    if ($stmt->execute()) {
        $newId = $db->lastInsertId();
        
        sendJSON([
            'success' => true,
            'message' => 'Anuncio creado exitosamente',
            'id' => $newId
        ], 201);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al crear el anuncio'
        ], 500);
    }
}

function updateAnuncio($id) {
    global $db;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $query = "UPDATE anuncios SET 
              titulo = :titulo,
              mensaje = :mensaje,
              tipo = :tipo,
              imagen = :imagen,
              duracion = :duracion,
              color_fondo = :color_fondo,
              color_texto = :color_texto,
              activo = :activo,
              fecha_inicio = :fecha_inicio,
              fecha_fin = :fecha_fin
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':titulo', $data['titulo']);
    $stmt->bindParam(':mensaje', $data['mensaje']);
    $stmt->bindParam(':tipo', $data['tipo']);
    $stmt->bindParam(':imagen', $data['imagen']);
    $stmt->bindParam(':duracion', $data['duracion']);
    $stmt->bindParam(':color_fondo', $data['color_fondo']);
    $stmt->bindParam(':color_texto', $data['color_texto']);
    $activo = isset($data['activo']) ? 1 : 0;
    $stmt->bindParam(':activo', $activo);
    $stmt->bindParam(':fecha_inicio', $data['fecha_inicio']);
    $stmt->bindParam(':fecha_fin', $data['fecha_fin']);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        sendJSON([
            'success' => true,
            'message' => 'Anuncio actualizado exitosamente'
        ]);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al actualizar el anuncio'
        ], 500);
    }
}

function deleteAnuncio($id) {
    global $db;
    
    $query = "DELETE FROM anuncios WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            sendJSON([
                'success' => true,
                'message' => 'Anuncio eliminado exitosamente'
            ]);
        } else {
            sendJSON([
                'success' => false,
                'message' => 'Anuncio no encontrado'
            ], 404);
        }
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al eliminar el anuncio'
        ], 500);
    }
}
?>