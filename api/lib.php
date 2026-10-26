<?php
// LastDance API · funções comuns (ligação à base de dados, login, conversão de dados).
declare(strict_types=1);
date_default_timezone_set('Europe/Lisbon');

/** Tipos de cada coluna: s texto, n número, b sim/não, j lista/objeto (JSON), pw palavra-passe (nunca sai do servidor). */
const SPEC = [
  'users' => ['id' => 's', 'name' => 's', 'email' => 's', 'password' => 'pw', 'role' => 's', 'isPartner' => 'b', 'eventId' => 's', 'staffEventIds' => 'j', 'phone' => 's'],
  'events' => [
    'id' => 's', 'name' => 's', 'code' => 's', 'venueId' => 's', 'location' => 's', 'category' => 's', 'date' => 's', 'start' => 's', 'end' => 's',
    'hasClasses' => 'b', 'classes' => 'j', 'installments' => 'j', 'commission' => 'n', 'capacity' => 'n', 'partners' => 'j',
    'comercial1' => 's', 'comercial2' => 's', 'share1' => 'n', 'archived' => 'b', 'votingMode' => 's', 'awards' => 'j', 'announced' => 'b', 'tables' => 'j',
    'modalities' => 'j', 'extras' => 'j', 'signupTypes' => 'j',
  ],
  'participants' => [
    'id' => 's', 'eventId' => 's', 'name' => 's', 'birth' => 's', 'phone' => 's', 'email' => 's', 'password' => 'pw', 'type' => 's', 'turma' => 's',
    'diet' => 's', 'health' => 's', 'consent' => 'b', 'createdAt' => 's', 'offer' => 'b', 'tableId' => 's', 'enteredAt' => 's', 'enteredBy' => 's', 'qr' => 's',
    'guardianName' => 's', 'guardianPhone' => 's', 'modalityId' => 's', 'extras' => 'j', 'customAmounts' => 'j', 'cancelledAt' => 's', 'cancelReason' => 's',
    'refundDue' => 'n', 'addedBy' => 's',
  ],
  'payments' => ['id' => 's', 'participantId' => 's', 'installment' => 'n', 'amount' => 'n', 'receivedBy' => 's', 'at' => 's', 'kind' => 's'],
  'votes' => ['id' => 's', 'eventId' => 's', 'awardId' => 's', 'voterId' => 's', 'candidateId' => 's'],
  'venues' => ['id' => 's', 'name' => 's', 'costPerPerson' => 'n', 'minimum' => 'n', 'capacity' => 'n'],
  'partners' => ['id' => 's', 'type' => 's', 'name' => 's', 'baseCost' => 'n'],
  'expenses' => ['id' => 's', 'description' => 's', 'category' => 's', 'amount' => 'n', 'date' => 's', 'paidBy' => 's', 'reimbursed' => 'b'],
];

function cfg(): array
{
  static $c = null;
  if ($c === null) {
    // Preferimos o ficheiro FORA do public_html (não fica acessível pela internet nem é apagado ao publicar).
    foreach ([dirname(__DIR__, 2) . '/lastdance-config.php', dirname(__DIR__) . '/lastdance-config.php', __DIR__ . '/config.php'] as $p) {
      if (is_file($p)) {
        $c = require $p;
        break;
      }
    }
    if (!is_array($c)) fail(500, 'Falta o ficheiro de configuração lastdance-config.php (vê o GUIA-HOSTINGER.md).');
  }
  return $c;
}

function db(): PDO
{
  static $pdo = null;
  if ($pdo === null) {
    $c = cfg();
    if (($c['driver'] ?? 'mysql') === 'sqlite') {
      $pdo = new PDO('sqlite:' . $c['sqlite_path']);
    } else {
      $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'] ?? 'localhost', (int)($c['db_port'] ?? 3306), $c['db_name']);
      $pdo = new PDO($dsn, $c['db_user'], $c['db_pass']);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  }
  return $pdo;
}

function q(string $sql, array $args = []): PDOStatement
{
  $st = db()->prepare($sql);
  $st->execute(array_values($args));
  return $st;
}
function one(string $sql, array $args = []): ?array
{
  $r = q($sql, $args)->fetch();
  return $r === false ? null : $r;
}
function all(string $sql, array $args = []): array
{
  return q($sql, $args)->fetchAll();
}
function in_list(array $ids): string
{
  return $ids ? implode(',', array_fill(0, count($ids), '?')) : "''";
}

// ---------- Respostas ----------

function out($data, int $code = 200): void
{
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
function fail(int $code, string $msg): void
{
  out(['error' => $msg], $code);
}
function body(): array
{
  $b = json_decode(file_get_contents('php://input') ?: '[]', true);
  return is_array($b) ? $b : [];
}
function now_iso(): string
{
  return (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');
}
function new_id(string $prefix): string
{
  return $prefix . bin2hex(random_bytes(6));
}

// ---------- Conversão entre a base de dados e o site ----------

/** Linha da base de dados → objeto do site (sem palavra-passe). */
function decode_row(string $t, array $r): array
{
  $o = [];
  foreach (SPEC[$t] as $k => $type) {
    if ($type === 'pw' || !array_key_exists($k, $r) || $r[$k] === null) continue;
    $v = $r[$k];
    if ($type === 'b') $o[$k] = (bool)(int)$v;
    elseif ($type === 'n') $o[$k] = $v + 0;
    elseif ($type === 'j') $o[$k] = json_decode((string)$v, true);
    else $o[$k] = (string)$v;
  }
  return $o;
}

/** Objeto do site → valores para a base de dados (todas as colunas, sem palavra-passe). */
function encode_row(string $t, array $o): array
{
  $r = [];
  foreach (SPEC[$t] as $k => $type) {
    if ($type === 'pw') continue;
    $v = $o[$k] ?? null;
    if ($v === null) $r[$k] = null;
    elseif ($type === 'b') $r[$k] = $v ? 1 : 0;
    elseif ($type === 'n') $r[$k] = is_numeric($v) ? $v + 0 : null;
    elseif ($type === 'j') $r[$k] = json_encode($v, JSON_UNESCAPED_UNICODE);
    else $r[$k] = mb_substr((string)$v, 0, 2000);
  }
  return $r;
}

/** Colunas que mudaram entre a linha guardada e a nova. */
function changed_fields(string $t, ?array $old, array $new): array
{
  if (!$old) return array_keys(array_filter($new, fn($v) => $v !== null));
  $ch = [];
  foreach ($new as $k => $v) {
    if ($k === 'id') continue;
    $a = $old[$k] ?? null;
    $type = SPEC[$t][$k];
    if ($a === null && $v === null) continue;
    if ($a === null || $v === null) {
      $ch[] = $k;
      continue;
    }
    if ($type === 'n' || $type === 'b') {
      if (abs((float)$a - (float)$v) > 0.0001) $ch[] = $k;
    } elseif ($type === 'j') {
      if (json_decode((string)$a, true) != json_decode((string)$v, true)) $ch[] = $k;
    } elseif ((string)$a !== (string)$v) $ch[] = $k;
  }
  return $ch;
}

function fetch_row(string $t, string $id): ?array
{
  return one("SELECT * FROM `$t` WHERE `id` = ?", [$id]);
}

const SCHEMA_VERSION = 2;

/** Acrescenta colunas que faltem (instalações feitas com uma versão anterior). Corre uma vez por versão. */
function migrate(): void
{
  try {
    $v = one("SELECT `v` FROM `meta` WHERE `k` = 'schema'");
  } catch (PDOException $e) {
    return; // ainda não instalado
  }
  if ($v && (int)$v['v'] >= SCHEMA_VERSION) return;
  $sqlite = (cfg()['driver'] ?? 'mysql') === 'sqlite';
  $types = ['s' => 'TEXT NULL', 'n' => 'DECIMAL(10,2) NULL', 'b' => 'TINYINT(1) NULL', 'j' => 'MEDIUMTEXT NULL', 'pw' => 'VARCHAR(255) NULL'];
  foreach (SPEC as $t => $cols) {
    $have = $sqlite ? array_column(all("PRAGMA table_info(`$t`)"), 'name') : array_column(all("SHOW COLUMNS FROM `$t`"), 'Field');
    foreach ($cols as $c => $type) {
      if (!in_array($c, $have, true)) db()->exec("ALTER TABLE `$t` ADD COLUMN `$c` " . ($sqlite && $type === 'j' ? 'TEXT NULL' : $types[$type]));
    }
  }
  if ($v) q("UPDATE `meta` SET `v` = ? WHERE `k` = 'schema'", [(string)SCHEMA_VERSION]);
  else q("INSERT INTO `meta` (`k`, `v`) VALUES ('schema', ?)", [(string)SCHEMA_VERSION]);
}

function bump_version(): void
{
  q("UPDATE `meta` SET `v` = CAST(`v` AS UNSIGNED) + 1 WHERE `k` = 'version'");
}
function version(): string
{
  return one("SELECT `v` FROM `meta` WHERE `k` = 'version'")['v'] ?? '1';
}

// ---------- Sessões ----------

function issue_token(string $kind, string $id): string
{
  $raw = bin2hex(random_bytes(32));
  q('DELETE FROM `tokens` WHERE `expiresAt` < ?', [time()]);
  q('INSERT INTO `tokens` (`token`, `kind`, `subjectId`, `expiresAt`) VALUES (?, ?, ?, ?)', [hash('sha256', $raw), $kind, $id, time() + 60 * 60 * 24 * 30]);
  return $raw;
}

function raw_token(): string
{
  $h = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
  if (!$h && isset($_SERVER['HTTP_AUTHORIZATION']) && str_starts_with($_SERVER['HTTP_AUTHORIZATION'], 'Bearer ')) $h = substr($_SERVER['HTTP_AUTHORIZATION'], 7);
  return preg_match('/^[a-f0-9]{64}$/', $h) ? $h : '';
}

/** Quem está a fazer o pedido: ['kind','id','role','eventId', ...] ou null. */
function me(): ?array
{
  static $me = false;
  if ($me !== false) return $me;
  $me = null;
  $raw = raw_token();
  if (!$raw) return null;
  $t = one('SELECT * FROM `tokens` WHERE `token` = ? AND `expiresAt` > ?', [hash('sha256', $raw), time()]);
  if (!$t) return null;
  if ($t['kind'] === 'user') {
    $u = fetch_row('users', $t['subjectId']);
    if ($u) $me = ['kind' => 'user', 'id' => $u['id'], 'role' => $u['role'], 'eventId' => $u['eventId'], 'staffEventIds' => json_decode((string)($u['staffEventIds'] ?? '[]'), true) ?: []];
  } else {
    $p = fetch_row('participants', $t['subjectId']);
    if ($p) $me = ['kind' => 'participant', 'id' => $p['id'], 'role' => 'participante', 'eventId' => $p['eventId']];
  }
  return $me;
}

function require_me(): array
{
  $m = me();
  if (!$m) fail(401, 'Sessão terminada. Faz log-in outra vez.');
  return $m;
}

function too_many_attempts(): bool
{
  $ip = $_SERVER['REMOTE_ADDR'] ?? '?';
  q('DELETE FROM `login_attempts` WHERE `at` < ?', [time() - 900]);
  return (int)one('SELECT COUNT(*) AS n FROM `login_attempts` WHERE `ip` = ?', [$ip])['n'] >= 10;
}
function record_attempt(): void
{
  q('INSERT INTO `login_attempts` (`ip`, `at`) VALUES (?, ?)', [$_SERVER['REMOTE_ADDR'] ?? '?', time()]);
}

// ---------- Regras do negócio (iguais às de src/data/logic.ts) ----------

function event_obj(string $id): ?array
{
  $r = fetch_row('events', $id);
  return $r ? decode_row('events', $r) : null;
}

function payments_of(array $participantIds): array
{
  $by = [];
  if (!$participantIds) return $by;
  foreach (array_chunk($participantIds, 800) as $chunk) {
    foreach (all('SELECT * FROM `payments` WHERE `participantId` IN (' . in_list($chunk) . ')', $chunk) as $r) {
      $by[$r['participantId']][] = decode_row('payments', $r);
    }
  }
  return $by;
}

/** Valor da prestação i para esta pessoa (modalidade/extras podem mudar o plano do evento). */
function inst_amount(array $p, array $ev, int $i): float
{
  $c = $p['customAmounts'] ?? null;
  return (float)(is_array($c) && isset($c[$i]) ? $c[$i] : ($ev['installments'][$i]['amount'] ?? 0));
}

function paid_for(array $payments, int $i): float
{
  $s = 0.0;
  foreach ($payments as $x) if ((int)$x['installment'] === $i && ($x['kind'] ?? 'payment') !== 'refund') $s += (float)$x['amount'];
  return $s;
}

function fully_paid(array $p, array $ev, array $payments): bool
{
  if (!empty($p['cancelledAt'])) return false;
  if (!empty($p['offer'])) return true;
  foreach ($ev['installments'] ?? [] as $i => $inst) {
    if (paid_for($payments, $i) < inst_amount($p, $ev, $i) - 0.001) return false;
  }
  return true;
}

function person_price(array $ev, ?string $modalityId, array $extras): float
{
  $base = 0.0;
  foreach ($ev['installments'] ?? [] as $inst) $base += (float)$inst['amount'];
  foreach ($ev['modalities'] ?? [] as $m) if ($m['id'] === $modalityId) $base = (float)$m['price'];
  foreach ($ev['extras'] ?? [] as $x) if (in_array($x['id'], $extras, true)) $base += (float)$x['price'];
  return $base;
}

/** Igual a recalcAmounts em src/data/logic.ts: as prestações com pagamentos ficam; a diferença reparte-se pelas outras. */
function recalc_amounts(array $p, array $ev, array $payments, ?string $modalityId, array $extras): ?array
{
  $inst = $ev['installments'] ?? [];
  $n = count($inst);
  if (!$n) return null;
  $target = round(person_price($ev, $modalityId, $extras), 2);
  $cur = [];
  $open = [];
  for ($i = 0; $i < $n; $i++) {
    $cur[$i] = inst_amount($p, $ev, $i);
    if (paid_for($payments, $i) <= 0.001) $open[] = $i;
  }
  $locked = 0.0;
  for ($i = 0; $i < $n; $i++) if (!in_array($i, $open, true)) $locked += $cur[$i];
  $out = $cur;
  if (!$open) {
    $out[$n - 1] = round($out[$n - 1] + $target - $locked, 2);
  } else {
    $rest = max(0, $target - $locked);
    $w = array_map(fn($i) => (float)$inst[$i]['amount'] ?: 1.0, $open);
    $wsum = array_sum($w);
    $acc = 0.0;
    foreach ($open as $k => $i) {
      $v = $k === count($open) - 1 ? round($rest - $acc, 2) : floor(($rest * $w[$k] / $wsum) * 100) / 100;
      $out[$i] = $v;
      $acc += $v;
    }
  }
  $same = true;
  for ($i = 0; $i < $n; $i++) if (abs($out[$i] - (float)$inst[$i]['amount']) >= 0.001) $same = false;
  return $same ? null : array_values($out);
}

/** Valida modalidade/extras contra o evento (ignora o que não existe). */
function clean_choices(array $ev, $modalityId, $extras): array
{
  $mod = null;
  foreach ($ev['modalities'] ?? [] as $m) if ($m['id'] === $modalityId) $mod = $m['id'];
  $valid = array_column($ev['extras'] ?? [], 'id');
  $ext = array_values(array_unique(array_filter(is_array($extras) ? $extras : [], fn($x) => in_array($x, $valid, true))));
  return [$mod, $ext];
}

function voting_open(array $ev): bool
{
  if (!empty($ev['announced'])) return false;
  $mode = $ev['votingMode'] ?? 'auto';
  if ($mode === 'open') return true;
  if ($mode !== 'auto') return false;
  $start = strtotime($ev['date'] . ' ' . ($ev['start'] ?? '20:00'));
  $end = strtotime($ev['date'] . ' ' . ($ev['end'] ?? '04:00'));
  if ($end <= $start) $end += 86400;
  return time() >= $start && time() <= $end;
}

function staff_can(array $me, string $eventId): bool
{
  return empty($me['staffEventIds']) || in_array($eventId, $me['staffEventIds'], true);
}
