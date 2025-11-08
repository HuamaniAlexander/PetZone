<?php
// api/productos.php - API Pública de Productos (sin autenticación)

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method !== 'GET') {
    sendJSON(['success' => false, 'message' => 'Método no permitido'], 405);
}

switch ($action) {
    case 'list':
        getProductos();
        break;
    case 'get':
        if (isset($_GET['id'])) {
            getProducto($_GET['id']);
        } else {
            sendJSON(['success' => false, 'message' => 'ID no proporcionado'], 400);
        }
        break;
    default:
        sendJSON(['success' => false, 'message' => 'Acción no válida'], 400);
}

function getProductos() {
    global $db;
    
    $categoria = $_GET['categoria'] ?? '';
    $destacado = $_GET['destacado'] ?? '';
    
    $query = "SELECT id, nombre, descripcion, categoria, precio, stock, imagen, destacado 
              FROM productos 
              WHERE activo = 1";
    
    if (!empty($categoria) && $categoria !== 'todos') {
        $query .= " AND categoria = :categoria";
    }
    
    if (!empty($destacado)) {
        $query .= " AND destacado = 1";
    }
    
    $query .= " ORDER BY destacado DESC, created_at DESC";
    
    $stmt = $db->prepare($query);
    
    if (!empty($categoria) && $categoria !== 'todos') {
        $stmt->bindParam(':categoria', $categoria);
    }
    
    $stmt->execute();
    $productos = $stmt->fetchAll();

    sendJSON([
        'success' => true,
        'productos' => $productos,
        'total' => count($productos)
    ]);
}

function getProducto($id) {
    global $db;
    
    $query = "SELECT id, nombre, descripcion, categoria, precio, stock, imagen, destacado 
              FROM productos 
              WHERE id = :id AND activo = 1 
              LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        sendJSON(['success' => false, 'message' => 'Producto no encontrado'], 404);
    }
    
    $producto = $stmt->fetch();
    
    sendJSON([
        'success' => true,
        'producto' => $producto
    ]);
}
?>