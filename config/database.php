<?php
// config/database.php - Conexión a la Base de Datos

class Database {
    private $host = "localhost";
    private $db_name = "petzone_db";
    private $username = "root";
    private $password = "";
    private $conn = null;

    public function getConnection() {
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch(PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            die(json_encode([
                'success' => false,
                'message' => 'Error de conexión a la base de datos'
            ]));
        }
        return $this->conn;
    }
}

// Función auxiliar para respuestas JSON
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Función para iniciar sesión
function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_secure', 0); // Cambiar a 1 en HTTPS
        session_start();
    }
}

// Función para verificar autenticación
function checkAuth() {
    startSecureSession();
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        sendJSON([
            'success' => false,
            'message' => 'No autorizado. Inicie sesión.'
        ], 401);
    }
}
?>