<?php
require_once __DIR__ . '/../core/Model.php';

class Carrito extends Model {
    protected $table = 'carritos';
    
    // Obtener items del carrito por session_id
    public function getBySession($sessionId) {
        $query = "SELECT c.*, p.nombre, p.imagen, p.descripcion, p.stock
                  FROM " . $this->table . " c
                  INNER JOIN productos p ON c.producto_id = p.id
                  WHERE c.session_id = ?
                  ORDER BY c.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Agregar producto al carrito
    public function agregarProducto($sessionId, $productoId, $cantidad = 1, $precioUnitario) {
        // Verificar si el producto ya está en el carrito
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE session_id = ? AND producto_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$sessionId, $productoId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Actualizar cantidad
            $nuevaCantidad = $existing['cantidad'] + $cantidad;
            return $this->actualizarCantidad($existing['id'], $nuevaCantidad);
        } else {
            // Crear nuevo item
            return $this->create([
                'session_id' => $sessionId,
                'producto_id' => $productoId,
                'cantidad' => $cantidad,
                'precio_unitario' => $precioUnitario
            ]);
        }
    }
    
    // Actualizar cantidad
    public function actualizarCantidad($id, $cantidad) {
        if ($cantidad <= 0) {
            return $this->delete($id);
        }
        return $this->update($id, ['cantidad' => $cantidad]);
    }
    
    // Obtener total del carrito
    public function getTotal($sessionId) {
        $query = "SELECT SUM(cantidad * precio_unitario) as total
                  FROM " . $this->table . "
                  WHERE session_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$sessionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'] ?? 0;
    }
    
    // Contar items del carrito
    public function contarItems($sessionId) {
        $query = "SELECT SUM(cantidad) as total_items
                  FROM " . $this->table . "
                  WHERE session_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$sessionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total_items'] ?? 0;
    }
    
    // Vaciar carrito
    public function vaciarCarrito($sessionId) {
        $query = "DELETE FROM " . $this->table . " WHERE session_id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$sessionId]);
    }
    
    // Eliminar item específico
    public function eliminarItem($sessionId, $productoId) {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE session_id = ? AND producto_id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$sessionId, $productoId]);
    }
}