<?php
// api/dashboard/auth.php - Sistema de Autenticación

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';

startSecureSession();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            login();
        } elseif ($action === 'logout') {
            logout();
        }
        break;
    
    case 'GET':
        if ($action === 'check') {
            checkSession();
        }
        break;
    
    default:
        sendJSON(['success' => false, 'message' => 'Método no permitido'], 405);
}

function login() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['username']) || empty($data['password'])) {
        sendJSON([
            'success' => false,
            'message' => 'Usuario y contraseña son requeridos'
        ], 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT id, username, password, email, role FROM usuarios WHERE username = :username LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $data['username']);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        sendJSON([
            'success' => false,
            'message' => 'Usuario o contraseña incorrectos'
        ], 401);
    }

    $user = $stmt->fetch();

    // Verificar contraseña
    if (!password_verify($data['password'], $user['password'])) {
        sendJSON([
            'success' => false,
            'message' => 'Usuario o contraseña incorrectos'
        ], 401);
    }

    // Actualizar último login
    $updateQuery = "UPDATE usuarios SET last_login = NOW() WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':id', $user['id']);
    $updateStmt->execute();

    // Crear sesión
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['email'] = $user['email'];

    sendJSON([
        'success' => true,
        'message' => 'Inicio de sesión exitoso',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
}

function logout() {
    $_SESSION = [];
    
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    
    session_destroy();

    sendJSON([
        'success' => true,
        'message' => 'Sesión cerrada exitosamente'
    ]);
}

function checkSession() {
    if (isset($_SESSION['user_id'])) {
        sendJSON([
            'success' => true,
            'authenticated' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'role' => $_SESSION['role'],
                'email' => $_SESSION['email']
            ]
        ]);
    } else {
        sendJSON([
            'success' => true,
            'authenticated' => false
        ]);
    }
}
?>