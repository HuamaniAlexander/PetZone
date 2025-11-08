<?php
// api/dashboard/productos.php - CRUD de Productos

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
            getProductos();
        } elseif ($action === 'get' && isset($_GET['id'])) {
            getProducto($_GET['id']);
        }
        break;
    
    case 'POST':
        if ($action === 'create') {
            createProducto();
        }
        break;
    
    case 'PUT':
        if ($action === 'update' && isset($_GET['id'])) {
            updateProducto($_GET['id']);
        }
        break;
    
    case 'DELETE':
        if ($action === 'delete' && isset($_GET['id'])) {
            deleteProducto($_GET['id']);
        }
        break;
    
    default:
        sendJSON(['success' => false, 'message' => 'Método no permitido'], 405);
}

function getProductos() {
    global $db;
    
    $categoria = $_GET['categoria'] ?? '';
    $busqueda = $_GET['busqueda'] ?? '';
    
    $query = "SELECT * FROM productos WHERE 1=1";
    
    if (!empty($categoria)) {
        $query .= " AND categoria = :categoria";
    }
    
    if (!empty($busqueda)) {
        $query .= " AND (nombre LIKE :busqueda OR descripcion LIKE :busqueda)";
    }
    
    $query .= " ORDER BY created_at DESC";
    
    $stmt = $db->prepare($query);
    
    if (!empty($categoria)) {
        $stmt->bindParam(':categoria', $categoria);
    }
    
    if (!empty($busqueda)) {
        $busquedaLike = "%{$busqueda}%";
        $stmt->bindParam(':busqueda', $busquedaLike);
    }
    
    $stmt->execute();
    $productos = $stmt->fetchAll();

    sendJSON([
        'success' => true,
        'productos' => $productos
    ]);
}

function getProducto($id) {
    global $db;
    
    $query = "SELECT * FROM productos WHERE id = :id LIMIT 1";
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

function createProducto() {
    global $db;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validaciones
    if (empty($data['nombre']) || empty($data['categoria']) || empty($data['precio'])) {
        sendJSON([
            'success' => false,
            'message' => 'Nombre, categoría y precio son obligatorios'
        ], 400);
    }
    
    $query = "INSERT INTO productos (nombre, descripcion, categoria, precio, stock, imagen, destacado, activo) 
              VALUES (:nombre, :descripcion, :categoria, :precio, :stock, :imagen, :destacado, :activo)";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':nombre', $data['nombre']);
    $stmt->bindParam(':descripcion', $data['descripcion']);
    $stmt->bindParam(':categoria', $data['categoria']);
    $stmt->bindParam(':precio', $data['precio']);
    $stmt->bindParam(':stock', $data['stock']);
    $stmt->bindParam(':imagen', $data['imagen']);
    $destacado = isset($data['destacado']) ? 1 : 0;
    $stmt->bindParam(':destacado', $destacado);
    $activo = isset($data['activo']) ? 1 : 0;
    $stmt->bindParam(':activo', $activo);
    
    if ($stmt->execute()) {
        $newId = $db->lastInsertId();
        
        sendJSON([
            'success' => true,
            'message' => 'Producto creado exitosamente',
            'id' => $newId
        ], 201);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al crear el producto'
        ], 500);
    }
}

function updateProducto($id) {
    global $db;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Verificar que el producto existe
    $checkQuery = "SELECT id FROM productos WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendJSON(['success' => false, 'message' => 'Producto no encontrado'], 404);
    }
    
    $query = "UPDATE productos SET 
              nombre = :nombre,
              descripcion = :descripcion,
              categoria = :categoria,
              precio = :precio,
              stock = :stock,
              imagen = :imagen,
              destacado = :destacado,
              activo = :activo
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':nombre', $data['nombre']);
    $stmt->bindParam(':descripcion', $data['descripcion']);
    $stmt->bindParam(':categoria', $data['categoria']);
    $stmt->bindParam(':precio', $data['precio']);
    $stmt->bindParam(':stock', $data['stock']);
    $stmt->bindParam(':imagen', $data['imagen']);
    $destacado = isset($data['destacado']) ? 1 : 0;
    $stmt->bindParam(':destacado', $destacado);
    $activo = isset($data['activo']) ? 1 : 0;
    $stmt->bindParam(':activo', $activo);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        sendJSON([
            'success' => true,
            'message' => 'Producto actualizado exitosamente'
        ]);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al actualizar el producto'
        ], 500);
    }
}

function deleteProducto($id) {
    global $db;
    
    $query = "DELETE FROM productos WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            sendJSON([
                'success' => true,
                'message' => 'Producto eliminado exitosamente'
            ]);
        } else {
            sendJSON([
                'success' => false,
                'message' => 'Producto no encontrado'
            ], 404);
        }
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Error al eliminar el producto'
        ], 500);
    }
}
?>