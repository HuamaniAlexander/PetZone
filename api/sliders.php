<?php
require_once __DIR__ . '/../models/Slider.php';
require_once __DIR__ . '/helpers/response.php';

$method = $_SERVER['REQUEST_METHOD'];
$slider = new Slider();

if ($method === 'GET') {
    // Obtener solo sliders activos para el público
    $data = $slider->getActivos();
    Response::success($data);
} else {
    Response::error('Método no permitido', 405);
}