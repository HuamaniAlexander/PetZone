<?php
require_once __DIR__ . '/../core/Model.php';

class Contenido extends Model {
    protected $table = 'contenido';
    
    // Obtener contenido por sección
    public function getBySeccion($seccion) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE seccion = ? AND activo = 1 
                  ORDER BY orden ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$seccion]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Obtener contenido activo
    public function getActivo() {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE activo = 1 
                  ORDER BY seccion, orden ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Obtener secciones únicas
    public function getSecciones() {
        $query = "SELECT DISTINCT seccion FROM " . $this->table . " ORDER BY seccion";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    // Reordenar contenido
    public function reordenar($ordenamiento) {
        foreach ($ordenamiento as $id => $orden) {
            $this->update($id, ['orden' => $orden]);
        }
        return true;
    }
    
    // Obtener último ID insertado
    public function getLastInsertId() {
        return $this->conn->lastInsertId();
    }
}