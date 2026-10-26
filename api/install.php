<?php
// LastDance · instalação: cria as tabelas e a primeira conta de administrador.
// Depois de instalar, esta página deixa de funcionar sozinha (já existe um administrador).
declare(strict_types=1);
require __DIR__ . '/lib.php';

function h(string $s): string
{
  return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

$msg = '';
$ok = false;
try {
  $pdo = db();
  $exists = (bool)one((cfg()['driver'] ?? 'mysql') === 'sqlite'
    ? "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'"
    : "SHOW TABLES LIKE 'users'");
  if (!$exists) {
    $sql = file_get_contents(__DIR__ . '/schema.sql');
    $sql = preg_replace('/^--.*$/m', '', $sql);
    if ((cfg()['driver'] ?? 'mysql') === 'sqlite') $sql = preg_replace('/\) ENGINE=[^;]+;/', ');', $sql);
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) $pdo->exec($stmt);
    $msg = 'Tabelas criadas.';
    migrate();
  }
  $hasAdmin = (bool)one("SELECT 1 FROM `users` WHERE `role` = 'admin'");

  if (!$hasAdmin && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $name = trim((string)($_POST['name'] ?? ''));
    $email = trim((string)($_POST['email'] ?? ''));
    $pass = (string)($_POST['password'] ?? '');
    if (mb_strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 8) {
      $msg = 'Preenche o nome, um email válido e uma palavra-passe com pelo menos 8 caracteres.';
    } else {
      q('INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `isPartner`, `staffEventIds`) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        new_id('u'), $name, $email, password_hash($pass, PASSWORD_DEFAULT), 'admin', 1, '[]',
      ]);
      $hasAdmin = true;
      $ok = true;
    }
  }
} catch (Throwable $e) {
  $msg = 'Não foi possível ligar à base de dados. Confirma os dados no lastdance-config.php. (' . $e->getMessage() . ')';
  $hasAdmin = false;
}
?>
<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Instalação | LastDance</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #591017; color: #fff8f0; font-family: system-ui, sans-serif; padding: 16px; }
    .card { width: 100%; max-width: 420px; background: rgba(36, 6, 10, 0.75); border: 1px solid rgba(254, 210, 137, 0.25); border-radius: 18px; padding: 28px; }
    h1 { margin-top: 0; color: #fed289; }
    label { display: block; font-size: 14px; margin: 14px 0 6px; }
    input { width: 100%; box-sizing: border-box; padding: 12px; border-radius: 10px; border: 1px solid rgba(254, 210, 137, 0.3); background: rgba(0, 0, 0, 0.25); color: inherit; font-size: 16px; }
    button { margin-top: 20px; width: 100%; padding: 13px; border: 0; border-radius: 999px; background: linear-gradient(135deg, #c07f42, #fed289); color: #3a0b12; font-weight: 700; font-size: 16px; cursor: pointer; }
    .msg { background: rgba(255, 255, 255, 0.08); padding: 10px 12px; border-radius: 10px; font-size: 14px; }
    a { color: #fed289; }
  </style>
</head>
<body>
  <div class="card">
    <h1>LastDance</h1>
    <?php if ($msg): ?><p class="msg"><?= h($msg) ?></p><?php endif; ?>
    <?php if ($ok): ?>
      <p>Conta de administrador criada. Já podes fazer <a href="/entrar">log-in</a>.</p>
      <p>Por segurança, apaga o ficheiro <b>api/install.php</b> no Gestor de Ficheiros.</p>
    <?php elseif ($hasAdmin): ?>
      <p>A plataforma já está instalada. Faz <a href="/entrar">log-in</a>.</p>
      <p>Podes apagar o ficheiro <b>api/install.php</b>.</p>
    <?php elseif (!str_starts_with($msg, 'Não foi possível')): ?>
      <p>Cria a primeira conta de administrador.</p>
      <form method="post">
        <label>Nome</label><input name="name" required autocomplete="name" />
        <label>Email</label><input name="email" type="email" required autocomplete="username" />
        <label>Palavra-passe (mínimo 8 caracteres)</label><input name="password" type="password" minlength="8" required autocomplete="new-password" />
        <button>Criar administrador</button>
      </form>
    <?php endif; ?>
  </div>
</body>
</html>
