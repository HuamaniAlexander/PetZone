<?php
require_once __DIR__ . '/../core/Model.php';

class Pedido extends Model {
    protected $table = 'pedidos';
    
    // Iniciar transacción
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }
    
    // Confirmar transacción
    public function commit() {
        return $this->conn->commit();
    }
    
    // Revertir transacción
    public function rollback() {
        return $this->conn->rollBack();
    }
    
    // Obtener último ID insertado
    public function getLastInsertId() {
        return $this->conn->lastInsertId();
    }
    
    // Crear detalle de pedido
    public function createDetalle($data) {
        $query = "INSERT INTO pedido_detalles 
                  (pedido_id, producto_id, cantidad, precio_unitario, subtotal) 
                  VALUES (:pedido_id, :producto_id, :cantidad, :precio_unitario, :subtotal)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindValue(':pedido_id', $data['pedido_id']);
        $stmt->bindValue(':producto_id', $data['producto_id']);
        $stmt->bindValue(':cantidad', $data['cantidad']);
        $stmt->bindValue(':precio_unitario', $data['precio_unitario']);
        $stmt->bindValue(':subtotal', $data['subtotal']);
        
        return $stmt->execute();
    }
    
    // Obtener detalles de un pedido
    public function getDetalles($pedidoId) {
        $query = "SELECT pd.*, p.nombre as producto_nombre, p.imagen as producto_imagen
                  FROM pedido_detalles pd
                  JOIN productos p ON pd.producto_id = p.id
                  WHERE pd.pedido_id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$pedidoId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Actualizar stock de producto
    public function actualizarStock($productoId, $cantidad) {
        $query = "UPDATE productos SET stock = stock - ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$cantidad, $productoId]);
    }
    
    // Actualizar estado del pedido
    public function actualizarEstado($pedidoId, $nuevoEstado) {
        $estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        
        if (!in_array($nuevoEstado, $estadosValidos)) {
            return false;
        }
        
        return $this->update($pedidoId, ['estado' => $nuevoEstado]);
    }
    
    // Obtener pedidos por estado
    public function getByEstado($estado) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE estado = ? 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$estado]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Obtener pedidos del día
    public function getPedidosHoy() {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE DATE(created_at) = CURDATE() 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Obtener estadísticas de pedidos
    public function getEstadisticas() {
        $query = "SELECT 
                    COUNT(*) as total_pedidos,
                    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'procesando' THEN 1 ELSE 0 END) as procesando,
                    SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) as entregados,
                    SUM(total) as total_ventas,
                    AVG(total) as promedio_venta
                  FROM " . $this->table;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Buscar pedidos por número o cliente
    public function buscar($termino) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE numero_pedido LIKE ? 
                  OR nombre_cliente LIKE ? 
                  OR email_cliente LIKE ?
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $search = "%$termino%";
        $stmt->execute([$search, $search, $search]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}