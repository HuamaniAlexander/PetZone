<?php
require_once __DIR__ . '/../models/Anuncio.php';
require_once __DIR__ . '/helpers/response.php';

$method = $_SERVER['REQUEST_METHOD'];
$anuncio = new Anuncio();

if ($method === 'GET') {
    // Obtener solo anuncios activos y vigentes
    $data = $anuncio->getVigentes();
    Response::success($data);
} else {
    Response::error('Método no permitido', 405);
}