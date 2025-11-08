<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/Carrito.php';
require_once __DIR__ . '/helpers/response.php';

// Generar o recuperar session_id
if (!isset($_SESSION['cart_session_id'])) {
    $_SESSION['cart_session_id'] = bin2hex(random_bytes(16));
}
$sessionId = $_SESSION['cart_session_id'];

$method = $_SERVER['REQUEST_METHOD'];
$carrito = new Carrito();

switch ($method) {
    case 'GET':
        // Obtener contenido del carrito
        if (isset($_GET['action'])) {
            $action = $_GET['action'];
            
            if ($action === 'count') {
                // Contar items
                $count = $carrito->contarItems($sessionId);
                Response::success(['count' => $count]);
            } elseif ($action === 'total') {
                // Obtener total
                $total = $carrito->getTotal($sessionId);
                Response::success(['total' => $total]);
            }
        } else {
            // Obtener todos los items
            $items = $carrito->getBySession($sessionId);
            $total = $carrito->getTotal($sessionId);
            $count = $carrito->contarItems($sessionId);
            
            Response::success([
                'items' => $items,
                'total' => $total,
                'count' => $count,
                'session_id' => $sessionId
            ]);
        }
        break;
        
    case 'POST':
        // Agregar producto al carrito
        $input = json_decode(file_get_contents('php://input'), true);
        
        $productoId = $input['producto_id'] ?? null;
        $cantidad = $input['cantidad'] ?? 1;
        $precioUnitario = $input['precio_unitario'] ?? 0;
        
        if (!$productoId || !$precioUnitario) {
            Response::error('Producto ID y precio son requeridos', 422);
        }
        
        if ($carrito->agregarProducto($sessionId, $productoId, $cantidad, $precioUnitario)) {
            $count = $carrito->contarItems($sessionId);
            Response::success([
                'count' => $count,
                'message' => 'Producto agregado al carrito'
            ], 'Producto agregado exitosamente');
        } else {
            Response::error('Error al agregar producto');
        }
        break;
        
    case 'PUT':
        // Actualizar cantidad
        $input = json_decode(file_get_contents('php://input'), true);
        
        $itemId = $input['id'] ?? null;
        $cantidad = $input['cantidad'] ?? 0;
        
        if (!$itemId) {
            Response::error('ID del item es requerido', 422);
        }
        
        if ($carrito->actualizarCantidad($itemId, $cantidad)) {
            $count = $carrito->contarItems($sessionId);
            $total = $carrito->getTotal($sessionId);
            
            Response::success([
                'count' => $count,
                'total' => $total
            ], 'Cantidad actualizada');
        } else {
            Response::error('Error al actualizar cantidad');
        }
        break;
        
    case 'DELETE':
        // Eliminar item o vaciar carrito
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['clear']) && $input['clear'] === true) {
            // Vaciar todo el carrito
            if ($carrito->vaciarCarrito($sessionId)) {
                Response::success([], 'Carrito vaciado exitosamente');
            } else {
                Response::error('Error al vaciar carrito');
            }
        } else {
            // Eliminar item específico
            $itemId = $input['id'] ?? null;
            
            if (!$itemId) {
                Response::error('ID del item es requerido', 422);
            }
            
            if ($carrito->delete($itemId)) {
                $count = $carrito->contarItems($sessionId);
                $total = $carrito->getTotal($sessionId);
                
                Response::success([
                    'count' => $count,
                    'total' => $total
                ], 'Producto eliminado del carrito');
            } else {
                Response::error('Error al eliminar producto');
            }
        }
        break;
        
    default:
        Response::error('Método no permitido', 405);
}