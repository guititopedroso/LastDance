<?php
// Configuração de CORS para permitir chamadas do ambiente de desenvolvimento local (Vite)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Listar memórias de uma escola
    if (empty($_GET['codigoEscola'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Código de escola é obrigatório']);
        exit;
    }
    
    $codigoEscola = $_GET['codigoEscola'];
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM memorias WHERE codigoEscola = ? AND reportada = 0 ORDER BY timestamp DESC");
        $stmt->execute([$codigoEscola]);
        $memorias = $stmt->fetchAll();
        
        // Ajustar formatos dos dados para manter compatibilidade com o frontend
        foreach ($memorias as &$m) {
            $m['id'] = (int)$m['id'];
            $m['reportada'] = (bool)$m['reportada'];
            // Converter timestamp em formato compatível com Firestore ({seconds})
            $m['timestamp'] = [
                'seconds' => strtotime($m['timestamp'])
            ];
        }
        
        echo json_encode($memorias);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao obter memórias: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'add';
    
    if ($action === 'add') {
        // Guardar nova memória (upload da imagem + metadados na base de dados)
        if (empty($_FILES['foto']) || empty($_POST['codigoEscola']) || empty($_POST['nif']) || empty($_POST['nomeAluno'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Campos obrigatórios em falta']);
            exit;
        }
        
        $codigoEscola = $_POST['codigoEscola'];
        $nif = $_POST['nif'];
        $nomeAluno = $_POST['nomeAluno'];
        $legenda = isset($_POST['legenda']) ? $_POST['legenda'] : '';
        $emoji = isset($_POST['emoji']) ? $_POST['emoji'] : '';
        
        $file = $_FILES['foto'];
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        
        if (!in_array(strtolower($ext), $allowedExts)) {
            http_response_code(400);
            echo json_encode(['error' => 'Formato de imagem inválido. Use JPG, PNG, WEBP ou GIF.']);
            exit;
        }
        
        // Certificar que a diretoria uploads existe
        $uploadDir = __DIR__ . '/../uploads';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $fileName = 'memoria_' . $codigoEscola . '_' . $nif . '_' . time() . '.' . $ext;
        $uploadFilePath = $uploadDir . '/' . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $uploadFilePath)) {
            // Obter protocolo e host
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
            $host = $_SERVER['HTTP_HOST'];
            
            // Descobrir se está numa subpasta do domínio
            $uri = $_SERVER['REQUEST_URI'];
            $apiPos = strpos($uri, '/api');
            $subpath = '';
            if ($apiPos !== false) {
                $subpath = substr($uri, 0, $apiPos);
            }
            
            $fotoURL = $protocol . $host . $subpath . '/uploads/' . $fileName;
            
            try {
                $stmt = $pdo->prepare("INSERT INTO memorias (codigoEscola, nif, nomeAluno, fotoURL, legenda, emoji) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$codigoEscola, $nif, $nomeAluno, $fotoURL, $legenda, $emoji]);
                $id = $pdo->lastInsertId();
                
                echo json_encode([
                    'success' => true, 
                    'id' => (int)$id,
                    'fotoURL' => $fotoURL
                ]);
            } catch (Exception $e) {
                // Eliminar ficheiro se falhar a escrita na BD
                if (file_exists($uploadFilePath)) {
                    unlink($uploadFilePath);
                }
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao guardar na base de dados: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao mover o ficheiro enviado para o servidor.']);
        }
        exit;
    }
    
    if ($action === 'report') {
        // Flag/reportar uma memória
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($input['id']) ? $input['id'] : null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID da memória em falta']);
            exit;
        }
        
        try {
            $stmt = $pdo->prepare("UPDATE memorias SET reportada = 1 WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao reportar memória: ' . $e->getMessage()]);
        }
        exit;
    }
    
    if ($action === 'delete') {
        // Eliminar uma memória (base de dados + ficheiro de imagem)
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($input['id']) ? $input['id'] : null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID da memória em falta']);
            exit;
        }
        
        try {
            // Obter URL da foto para a podermos eliminar do disco
            $stmt = $pdo->prepare("SELECT fotoURL FROM memorias WHERE id = ?");
            $stmt->execute([$id]);
            $mem = $stmt->fetch();
            
            if ($mem) {
                $fotoURL = $mem['fotoURL'];
                $fileName = basename($fotoURL);
                $filePath = __DIR__ . '/../uploads/' . $fileName;
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
            
            $stmt = $pdo->prepare("DELETE FROM memorias WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao eliminar memória: ' . $e->getMessage()]);
        }
        exit;
    }
}
