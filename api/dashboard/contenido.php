<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../models/Contenido.php';
require_once __DIR__ . '/../helpers/response.php';

// Verificar autenticación
session_start();
if (!isset($_SESSION['user_id'])) {
    Response::error('No autorizado', 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$contenido = new Contenido();

switch ($method) {
    case 'GET':
        // Obtener contenido (todos o por sección)
        if (isset($_GET['seccion'])) {
            $data = $contenido->getBySeccion($_GET['seccion']);
        } elseif (isset($_GET['id'])) {
            $data = $contenido->getById($_GET['id']);
        } else {
            $data = $contenido->getAll();
        }
        Response::success($data);
        break;
        
    case 'POST':
        // Crear nuevo contenido
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['seccion']) || empty($input['titulo'])) {
            Response::error('Sección y título son obligatorios', 422);
        }
        
        $data = [
            'seccion' => htmlspecialchars($input['seccion']),
            'titulo' => htmlspecialchars($input['titulo']),
            'contenido' => htmlspecialchars($input['contenido'] ?? ''),
            'tipo' => htmlspecialchars($input['tipo'] ?? 'texto'),
            'archivo' => $input['archivo'] ?? null,
            'orden' => intval($input['orden'] ?? 0),
            'activo' => isset($input['activo']) ? 1 : 0
        ];
        
        if ($contenido->create($data)) {
            Response::success(['id' => $contenido->getLastInsertId()], 'Contenido creado exitosamente');
        } else {
            Response::error('Error al crear contenido');
        }
        break;
        
    case 'PUT':
        // Actualizar contenido
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        
        if (!$id) {
            Response::error('ID del contenido es requerido', 422);
        }
        
        $data = [
            'seccion' => htmlspecialchars($input['seccion']),
            'titulo' => htmlspecialchars($input['titulo']),
            'contenido' => htmlspecialchars($input['contenido'] ?? ''),
            'tipo' => htmlspecialchars($input['tipo'] ?? 'texto'),
            'orden' => intval($input['orden'] ?? 0),
            'activo' => isset($input['activo']) ? 1 : 0
        ];
        
        if (isset($input['archivo'])) {
            $data['archivo'] = $input['archivo'];
        }
        
        if ($contenido->update($id, $data)) {
            Response::success([], 'Contenido actualizado exitosamente');
        } else {
            Response::error('Error al actualizar contenido');
        }
        break;
        
    case 'DELETE':
        // Eliminar contenido
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        
        if (!$id) {
            Response::error('ID del contenido es requerido', 422);
        }
        
        if ($contenido->delete($id)) {
            Response::success([], 'Contenido eliminado exitosamente');
        } else {
            Response::error('Error al eliminar contenido');
        }
        break;
        
    default:
        Response::error('Método no permitido', 405);
}