<?php
// Configurações da base de dados MySQL (edita estes valores de acordo com o teu phpMyAdmin/servidor)

define('DB_HOST', 'localhost');
define('DB_NAME', 'novabase');
define('DB_USER', 'gui2');
define('DB_PASS', 'Guitito2006');

// Conexão com a base de dados via PDO
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'Falha na ligação à base de dados: ' . $e->getMessage()]);
    exit;
}
