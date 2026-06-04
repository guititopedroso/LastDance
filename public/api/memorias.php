<?php
// Configuração de CORS para permitir chamadas do ambiente de desenvolvimento local (Vite)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

// Desativar cache para garantir atualizações em tempo real (evita caching de LiteSpeed/Varnish/Cloudflare)
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");

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
    
    // Corrigir permissões das fotos antigas para garantir que são públicas e legíveis
    $uploadDir = __DIR__ . '/../uploads';
    if (file_exists($uploadDir)) {
        @chmod($uploadDir, 0755);
        $files = @scandir($uploadDir);
        if ($files !== false) {
            foreach ($files as $file) {
                if ($file !== '.' && $file !== '..') {
                    @chmod($uploadDir . '/' . $file, 0644);
                }
            }
        }
    }
    
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
        
        // Certificar que a diretoria uploads existe e é editável
        $uploadDir = __DIR__ . '/../uploads';
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                http_response_code(500);
                echo json_encode(['error' => 'Não foi possível criar a pasta de uploads no servidor. Verifica as permissões da pasta-mãe.']);
                exit;
            }
        }
        
        @chmod($uploadDir, 0755);
        
        if (!is_writable($uploadDir)) {
            http_response_code(500);
            echo json_encode(['error' => 'A pasta de uploads não tem permissões de escrita (chmod 755/777).']);
            exit;
        }
        
        $file = $_FILES['foto'];
        
        // Verificar erros de upload do PHP
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $uploadErrors = [
                UPLOAD_ERR_INI_SIZE   => 'O ficheiro excede o limite de tamanho definido no servidor (upload_max_filesize).',
                UPLOAD_ERR_FORM_SIZE  => 'O ficheiro excede o limite definido no formulário.',
                UPLOAD_ERR_PARTIAL    => 'O upload do ficheiro foi feito apenas parcialmente.',
                UPLOAD_ERR_NO_FILE    => 'Nenhum ficheiro foi enviado.',
                UPLOAD_ERR_NO_TMP_DIR => 'Falta a pasta temporária no servidor.',
                UPLOAD_ERR_CANT_WRITE => 'Falha ao escrever o ficheiro no disco do servidor.',
                UPLOAD_ERR_EXTENSION  => 'Uma extensão do PHP parou o upload do ficheiro.'
            ];
            $errMsg = isset($uploadErrors[$file['error']]) ? $uploadErrors[$file['error']] : 'Erro desconhecido no upload.';
            http_response_code(400);
            echo json_encode(['error' => $errMsg]);
            exit;
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        
        if (!in_array(strtolower($ext), $allowedExts)) {
            http_response_code(400);
            echo json_encode(['error' => 'Formato de imagem inválido. Use JPG, PNG, WEBP ou GIF.']);
            exit;
        }
        
        $fileName = 'memoria_' . $codigoEscola . '_' . $nif . '_' . time() . '.' . $ext;
        $uploadFilePath = $uploadDir . '/' . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $uploadFilePath)) {
            @chmod($uploadFilePath, 0644);
            // Obter protocolo e host
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443 || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')) ? "https://" : "http://";
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
