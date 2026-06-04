<!DOCTYPE html>
<html>
<head>
    <title>Debug Search</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        h1, h2 { color: #fff; border-bottom: 1px solid #333; }
        .section { margin-bottom: 20px; padding: 10px; border: 1px solid #222; }
        .exists { color: #0f0; }
        .missing { color: #f00; }
    </style>
</head>
<body>
    <h1>Debug Search for Memories on Server</h1>
    <div class="section">
        <p><strong>Starting Search...</strong></p>
    </div>

    <?php
    $startDir = '/home/u236076924/domains/lastdance.pt/';
    
    if (!file_exists($startDir)) {
        $startDir = $_SERVER['DOCUMENT_ROOT'];
    }
    
    echo "<div class='section'>";
    echo "<h2>Searching in: $startDir</h2>";
    
    $foundFiles = [];
    $foundDirs = [];
    
    function search($dir, &$foundFiles, &$foundDirs) {
        $items = @scandir($dir);
        if ($items === false) return;
        
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            
            $path = $dir . '/' . $item;
            if (is_dir($path)) {
                if (strtolower($item) === 'uploads') {
                    $foundDirs[] = $path;
                }
                // Avoid infinite recursion or very deep vendor/node_modules directories
                if ($item !== 'node_modules' && $item !== '.git' && $item !== 'vendor') {
                    search($path, $foundFiles, $foundDirs);
                }
            } else {
                if (strpos($item, 'memoria_') === 0) {
                    $foundFiles[] = $path . " (" . filesize($path) . " bytes)";
                }
            }
        }
    }
    
    search($startDir, $foundFiles, $foundDirs);
    
    echo "<h3>Folders found matching 'uploads':</h3>";
    if (empty($foundDirs)) {
        echo "<p class='missing'>No 'uploads' directories found anywhere!</p>";
    } else {
        echo "<ul>";
        foreach ($foundDirs as $d) {
            echo "<li class='exists'>$d (Writable: " . (is_writable($d) ? 'YES' : 'NO') . ", Perms: " . substr(sprintf('%o', fileperms($d)), -4) . ")</li>";
        }
        echo "</ul>";
    }
    
    echo "<h3>Files found starting with 'memoria_':</h3>";
    if (empty($foundFiles)) {
        echo "<p class='missing'>No files starting with 'memoria_' found anywhere!</p>";
    } else {
        echo "<ul>";
        foreach ($foundFiles as $f) {
            echo "<li class='exists'>$f</li>";
        }
        echo "</ul>";
    }
    echo "</div>";
    ?>
</body>
</html>
