<?php
header("Content-Type: text/plain; charset=utf-8");

echo "=== Debug LastDance Uploads ===\n\n";
echo "Current File: " . __FILE__ . "\n";
echo "Current Dir: " . __DIR__ . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n\n";

// List of potential uploads directories to search for
$searchDirs = [
    'Relative to API (../uploads)' => __DIR__ . '/../uploads',
    'Relative to API (uploads)' => __DIR__ . '/uploads',
    'Root uploads (../../uploads)' => __DIR__ . '/../../uploads',
    'Document root uploads' => $_SERVER['DOCUMENT_ROOT'] . '/uploads',
    'Document root api/uploads' => $_SERVER['DOCUMENT_ROOT'] . '/api/uploads'
];

foreach ($searchDirs as $label => $path) {
    $realPath = realpath($path);
    echo "--- $label ---\n";
    echo "Path: $path\n";
    echo "Resolved Path: " . ($realPath ? $realPath : "NOT RESOLVED (does not exist or not readable)") . "\n";
    
    if ($realPath && file_exists($realPath)) {
        echo "Status: EXISTS\n";
        echo "Permissions: " . substr(sprintf('%o', fileperms($realPath)), -4) . "\n";
        echo "Writable? " . (is_writable($realPath) ? "YES" : "NO") . "\n";
        
        $files = scandir($realPath);
        if ($files === false) {
            echo "Could not list files.\n";
        } else {
            $count = 0;
            foreach ($files as $file) {
                if ($file !== '.' && $file !== '..') {
                    $count++;
                    if ($count <= 5) {
                        $filePath = $realPath . '/' . $file;
                        echo "  - $file (" . filesize($filePath) . " bytes)\n";
                    }
                }
            }
            echo "Total files: $count\n";
            if ($count > 5) {
                echo "  (and " . ($count - 5) . " more files)\n";
            }
        }
    } else {
        echo "Status: DOES NOT EXIST\n";
    }
    echo "\n";
}
