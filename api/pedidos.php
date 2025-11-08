<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/Pedido.php';
require_once __DIR__ . '/helpers/response.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos
    if (empty($input['nombre']) || empty($input['email']) || empty($input['telefono'])) {
        Response::error('Datos del cliente son requeridos', 422);
    }
    
    if (empty($input['items']) || !is_array($input['items'])) {
        Response::error('Items del pedido son requeridos', 422);
    }
    
    try {
        // Generar número de pedido único
        $numeroPedido = 'PZ-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        
        // Crear pedido
        $dataPedido = [
            'numero_pedido' => $numeroPedido,
            'nombre_cliente' => htmlspecialchars($input['nombre']),
            'email_cliente' => htmlspecialchars($input['email']),
            'telefono_cliente' => htmlspecialchars($input['telefono']),
            'direccion_envio' => htmlspecialchars($input['direccion'] . ', ' . $input['distrito'] . ', ' . $input['ciudad']),
            'subtotal' => floatval($input['subtotal']),
            'impuesto' => 0,
            'total' => floatval($input['total']),
            'estado' => 'pendiente',
            'metodo_pago' => htmlspecialchars($input['metodo_pago']),
            'notas' => htmlspecialchars($input['referencia'] ?? '')
        ];
        
        // Iniciar transacción
        $database = new Database();
        $conn = $database->connect();
        $conn->beginTransaction();
        
        // Insertar pedido
        $query = "INSERT INTO pedidos (numero_pedido, nombre_cliente, email_cliente, telefono_cliente, 
                  direccion_envio, subtotal, impuesto, total, estado, metodo_pago, notas) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $dataPedido['numero_pedido'],
            $dataPedido['nombre_cliente'],
            $dataPedido['email_cliente'],
            $dataPedido['telefono_cliente'],
            $dataPedido['direccion_envio'],
            $dataPedido['subtotal'],
            $dataPedido['impuesto'],
            $dataPedido['total'],
            $dataPedido['estado'],
            $dataPedido['metodo_pago'],
            $dataPedido['notas']
        ]);
        
        $pedidoId = $conn->lastInsertId();
        
        // Insertar detalles del pedido
        $queryDetalle = "INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, subtotal) 
                         VALUES (?, ?, ?, ?, ?)";
        $stmtDetalle = $conn->prepare($queryDetalle);
        
        foreach ($input['items'] as $item) {
            $subtotalItem = $item['cantidad'] * $item['precio_unitario'];
            $stmtDetalle->execute([
                $pedidoId,
                $item['producto_id'],
                $item['cantidad'],
                $item['precio_unitario'],
                $subtotalItem
            ]);
        }
        
        // Commit transacción
        $conn->commit();
        
        Response::success([
            'pedido_id' => $pedidoId,
            'numero_pedido' => $numeroPedido
        ], 'Pedido creado exitosamente');
        
    } catch (Exception $e) {
        if (isset($conn)) {
            $conn->rollBack();
        }
        Response::error('Error al crear pedido: ' . $e->getMessage());
    }
} else {
    Response::error('Método no permitido', 405);
}