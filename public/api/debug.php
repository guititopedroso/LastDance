<!DOCTYPE html>
<html>
<head>
    <title>Debug Uploads</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        h1, h2 { color: #fff; border-bottom: 1px solid #333; }
        .section { margin-bottom: 20px; padding: 10px; border: 1px solid #222; }
        .exists { color: #0f0; }
        .missing { color: #f00; }
    </style>
</head>
<body>
    <h1>Debug LastDance Uploads</h1>
    <div class="section">
        <p><strong>Current File:</strong> <?php echo __FILE__; ?></p>
        <p><strong>Current Dir:</strong> <?php echo __DIR__; ?></p>
        <p><strong>Document Root:</strong> <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
    </div>

    <?php
    $searchDirs = [
        'Relative to API (../uploads)' => __DIR__ . '/../uploads',
        'Relative to API (uploads)' => __DIR__ . '/uploads',
        'Root uploads (../../uploads)' => __DIR__ . '/../../uploads',
        'Document root uploads' => $_SERVER['DOCUMENT_ROOT'] . '/uploads',
        'Document root api/uploads' => $_SERVER['DOCUMENT_ROOT'] . '/api/uploads'
    ];

    foreach ($searchDirs as $label => $path) {
        echo "<div class='section'>";
        echo "<h2>$label</h2>";
        echo "<p><strong>Configured Path:</strong> $path</p>";
        
        try {
            $realPath = realpath($path);
            if ($realPath) {
                echo "<p><strong>Resolved Path:</strong> $realPath</p>";
                if (file_exists($realPath)) {
                    echo "<p class='exists'><strong>Status:</strong> EXISTS</p>";
                    $perms = @fileperms($realPath);
                    if ($perms !== false) {
                        echo "<p><strong>Permissions:</strong> " . substr(sprintf('%o', $perms), -4) . "</p>";
                    }
                    echo "<p><strong>Writable?</strong> " . (is_writable($realPath) ? "YES" : "NO") . "</p>";
                    
                    $files = @scandir($realPath);
                    if ($files === false) {
                        echo "<p class='missing'>Could not list files.</p>";
                    } else {
                        $count = 0;
                        echo "<ul>";
                        foreach ($files as $file) {
                            if ($file !== '.' && $file !== '..') {
                                $count++;
                                if ($count <= 10) {
                                    $filePath = $realPath . '/' . $file;
                                    $fileSize = @filesize($filePath);
                                    $filePerms = @fileperms($filePath);
                                    $fPermsStr = $filePerms !== false ? substr(sprintf('%o', $filePerms), -4) : "unknown";
                                    echo "<li>$file ($fileSize bytes, perms: $fPermsStr)</li>";
                                }
                            }
                        }
                        echo "</ul>";
                        echo "<p><strong>Total files:</strong> $count</p>";
                    }
                } else {
                    echo "<p class='missing'><strong>Status:</strong> DOES NOT EXIST (file_exists failed)</p>";
                }
            } else {
                echo "<p class='missing'><strong>Status:</strong> NOT RESOLVED (does not exist)</p>";
            }
        } catch (Exception $e) {
            echo "<p class='missing'><strong>Error:</strong> " . $e->getMessage() . "</p>";
        }
        echo "</div>";
    }
    ?>
</body>
</html>
