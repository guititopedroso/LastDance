<?php
// LastDance API · todas as rotas: index.php?r=login | logout | bootstrap | version | sync | event | register
declare(strict_types=1);
require __DIR__ . '/lib.php';

// Só para desenvolvimento (site noutro endereço). Em produção o site e a API estão no mesmo domínio.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, cfg()['allowed_origins'] ?? [], true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') exit;

try {
  $r = $_GET['r'] ?? '';
  $post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
  match (true) {
    $r === 'login' && $post => route_login(),
    $r === 'logout' && $post => route_logout(),
    $r === 'bootstrap' => route_bootstrap(),
    $r === 'version' => out(['version' => version()]),
    $r === 'sync' && $post => route_sync(),
    $r === 'event' => route_event(),
    $r === 'register' && $post => route_register(),
    default => fail(404, 'Rota desconhecida.'),
  };
} catch (PDOException $e) {
  error_log('LastDance API: ' . $e->getMessage());
  fail(500, 'Erro na base de dados. Tenta outra vez.');
}

// ---------- Login ----------

function route_login(): void
{
  if (too_many_attempts()) fail(429, 'Demasiadas tentativas. Espera 15 minutos.');
  $b = body();
  $email = trim((string)($b['email'] ?? ''));
  $pass = (string)($b['password'] ?? '');
  if (!$email || !$pass) fail(400, 'Preenche o email e a palavra-passe.');

  $u = one('SELECT * FROM `users` WHERE LOWER(`email`) = LOWER(?)', [$email]);
  if ($u && $u['password'] && password_verify($pass, $u['password'])) {
    out(['token' => issue_token('user', $u['id']), 'session' => ['kind' => 'user', 'id' => $u['id']]]);
  }
  // O mesmo email pode ter inscrições em vários eventos: fica a mais recente cuja palavra-passe bate certo.
  foreach (all('SELECT * FROM `participants` WHERE LOWER(`email`) = LOWER(?) ORDER BY `createdAt` DESC', [$email]) as $p) {
    if ($p['password'] && password_verify($pass, $p['password'])) {
      out(['token' => issue_token('participant', $p['id']), 'session' => ['kind' => 'participant', 'id' => $p['id']]]);
    }
  }
  record_attempt();
  fail(401, 'Email ou palavra-passe incorretos.');
}

function route_logout(): void
{
  $raw = raw_token();
  if ($raw) q('DELETE FROM `tokens` WHERE `token` = ?', [hash('sha256', $raw)]);
  out(['ok' => true]);
}

// ---------- Dados de cada perfil ----------

function route_bootstrap(): void
{
  $me = require_me();
  $role = $me['role'];
  $d = ['version' => 1, 'users' => [], 'events' => [], 'participants' => [], 'votes' => [], 'venues' => [], 'partners' => [], 'expenses' => []];
  $evIds = [];

  if ($role === 'admin') {
    foreach (['users', 'events', 'votes', 'venues', 'partners', 'expenses'] as $t) $d[$t] = array_map(fn($r) => decode_row($t, $r), all("SELECT * FROM `$t`"));
    $parts = all('SELECT * FROM `participants`');
  } else {
    if ($role === 'comercial') $evRows = all('SELECT * FROM `events` WHERE `comercial1` = ? OR `comercial2` = ?', [$me['id'], $me['id']]);
    elseif ($role === 'staff') $evRows = array_values(array_filter(all('SELECT * FROM `events` WHERE `archived` = 0 OR `archived` IS NULL'), fn($e) => staff_can($me, $e['id'])));
    else $evRows = $me['eventId'] ? all('SELECT * FROM `events` WHERE `id` = ?', [$me['eventId']]) : [];
    $d['events'] = array_map(function ($r) use ($role) {
      $e = decode_row('events', $r);
      $e['partners'] = []; // custos e parceiros: só a administração
      if ($role === 'participante') unset($e['commission'], $e['comercial1'], $e['comercial2'], $e['share1']);
      return $e;
    }, $evRows);
    $evIds = array_column($d['events'], 'id');
    $parts = $evIds ? all('SELECT * FROM `participants` WHERE `eventId` IN (' . in_list($evIds) . ')', $evIds) : [];
  }

  $pay = payments_of(array_column($parts, 'id'));
  $evById = [];
  foreach ($d['events'] as $e) $evById[$e['id']] = $e;

  foreach ($parts as $row) {
    $p = decode_row('participants', $row);
    $p['payments'] = $pay[$p['id']] ?? [];
    $p['password'] = '';
    if ($role === 'participante' && $p['id'] !== $me['id']) {
      // Colegas: só o necessário para a mesa e a votação (nome, mesa e se já pagou tudo).
      $paid = isset($evById[$p['eventId']]) && fully_paid($p, $evById[$p['eventId']], $p['payments']);
      $inst = $evById[$p['eventId']]['installments'] ?? [];
      $p = [
        'id' => $p['id'], 'eventId' => $p['eventId'], 'name' => $p['name'], 'type' => $p['type'] ?? 'finalista', 'tableId' => $p['tableId'] ?? null,
        'offer' => false, 'birth' => '', 'phone' => '', 'email' => '', 'password' => '', 'diet' => 'Nenhuma', 'consent' => null, 'createdAt' => '', 'qr' => '',
        'payments' => $paid ? array_map(fn($i, $x) => ['id' => 'x' . $i, 'installment' => $i, 'amount' => $x['amount'], 'receivedBy' => null, 'at' => '', 'kind' => 'payment'], array_keys($inst), $inst) : [],
      ];
      $p = array_filter($p, fn($v) => $v !== null);
    } elseif ($role === 'staff') {
      unset($p['email'], $p['phone'], $p['health']);
    }
    $d['participants'][] = $p;
  }

  if ($role !== 'admin') {
    // Nomes de quem recebeu pagamentos / registou entradas e da equipa do evento (sem emails de outros perfis).
    $ids = [$me['id']];
    foreach ($d['participants'] as $p) {
      foreach ($p['payments'] as $x) if (!empty($x['receivedBy'])) $ids[] = $x['receivedBy'];
      if (!empty($p['enteredBy'])) $ids[] = $p['enteredBy'];
    }
    foreach ($d['events'] as $e) foreach (['comercial1', 'comercial2'] as $c) if (!empty($e[$c])) $ids[] = $e[$c];
    $ids = array_values(array_unique($ids));
    $users = all('SELECT * FROM `users` WHERE `id` IN (' . in_list($ids) . ')' . ($evIds && $role !== 'participante' ? ' OR `eventId` IN (' . in_list($evIds) . ')' : ''), array_merge($ids, $role !== 'participante' ? $evIds : []));
    foreach ($users as $u) {
      $o = decode_row('users', $u);
      $o['password'] = '';
      if ($o['id'] !== $me['id'] && !in_array($role, ['promotor_chefe'], true)) $o['email'] = '';
      $d['users'][] = $o;
    }
    if ($role === 'participante') $d['votes'] = array_map(fn($r) => decode_row('votes', $r), all('SELECT * FROM `votes` WHERE `voterId` = ?', [$me['id']]));
  } else {
    foreach ($d['users'] as &$u) $u['password'] = '';
  }

  out(['db' => $d, 'version' => version(), 'me' => ['kind' => $me['kind'], 'id' => $me['id']]]);
}

// ---------- Gravar alterações ----------

const ORDER = ['venues', 'partners', 'users', 'events', 'participants', 'payments', 'expenses', 'votes'];

function route_sync(): void
{
  $me = require_me();
  $ops = body()['ops'] ?? [];
  if (!is_array($ops) || count($ops) > 3000) fail(400, 'Pedido inválido.');
  $errors = [];
  $done = 0;
  db()->beginTransaction();
  foreach ($ops as $op) {
    try {
      $err = apply_op($me, is_array($op) ? $op : []);
      if ($err) $errors[] = $err;
      else $done++;
    } catch (PDOException $e) {
      $msg = $e->getMessage();
      $errors[] = (str_contains($msg, 'Duplicate') || str_contains($msg, 'UNIQUE')) ? 'Já existe um registo com esse email ou código.' : 'Não foi possível guardar uma alteração.';
      error_log('LastDance sync: ' . $msg);
    }
  }
  if ($done) bump_version();
  db()->commit();
  out(['ok' => true, 'saved' => $done, 'errors' => array_values(array_unique($errors)), 'version' => version()]);
}

function apply_op(array $me, array $op): ?string
{
  $t = (string)($op['t'] ?? '');
  if (!isset(SPEC[$t])) return 'Tipo de dados desconhecido.';
  $admin = $me['role'] === 'admin';

  if (($op['op'] ?? '') === 'delete') {
    $old = fetch_row($t, (string)($op['id'] ?? ''));
    if (!$old) return null;
    $err = can_delete($me, $t, $old);
    if ($err) return $err;
    q("DELETE FROM `$t` WHERE `id` = ?", [$old['id']]);
    if ($t === 'participants') {
      q('DELETE FROM `payments` WHERE `participantId` = ?', [$old['id']]);
      q('DELETE FROM `votes` WHERE `voterId` = ? OR `candidateId` = ?', [$old['id'], $old['id']]);
    }
    return null;
  }

  $row = $op['row'] ?? null;
  if (!is_array($row) || empty($row['id']) || !is_string($row['id']) || strlen($row['id']) > 90) return 'Dados inválidos.';
  $old = fetch_row($t, $row['id']);
  $new = encode_row($t, $row);

  // Campos que este perfil nem recebe (ver route_bootstrap): mantêm-se como estão na base de dados.
  if ($old) foreach (hidden_fields($me, $t) as $k) $new[$k] = $old[$k] ?? null;

  // Campos que o servidor decide (não confiamos no telemóvel de quem envia)
  if ($t === 'payments' && !$admin) {
    $new['receivedBy'] = $me['id'];
    $new['at'] = now_iso();
  }
  if ($t === 'participants' && !$admin && $old && $new['enteredAt'] !== ($old['enteredAt'] ?? null)) {
    if ($new['enteredAt'] !== null) {
      $new['enteredAt'] = now_iso();
      $new['enteredBy'] = $me['id'];
    } else $new['enteredBy'] = null;
  }

  $changed = changed_fields($t, $old, $new);
  $pw = (isset(SPEC[$t]['password']) && isset($row['password']) && is_string($row['password']) && $row['password'] !== '') ? $row['password'] : null;
  if ($pw !== null) {
    if (strlen($pw) < 6) return 'A palavra-passe tem de ter pelo menos 6 caracteres.';
    $changed[] = 'password';
  }
  if (!$changed) return null;
  $err = can_write($me, $t, $old, $new, $changed);
  if ($err) return $err;

  if ($old) {
    $cols = array_values(array_filter($changed, fn($k) => $k !== 'password'));
    if ($cols) {
      $sets = implode(', ', array_map(fn($k) => "`$k` = ?", $cols));
      q("UPDATE `$t` SET $sets WHERE `id` = ?", array_merge(array_map(fn($k) => $new[$k], $cols), [$old['id']]));
    }
  } else {
    $cols = array_keys($new);
    q("INSERT INTO `$t` (`" . implode('`, `', $cols) . '`) VALUES (' . in_list($cols) . ')', array_values($new));
  }
  if ($pw !== null) q("UPDATE `$t` SET `password` = ? WHERE `id` = ?", [password_hash($pw, PASSWORD_DEFAULT), $new['id']]);
  return null;
}

/** Campos escondidos a cada perfil no route_bootstrap (o site devolve-os vazios; não contam como alteração). */
function hidden_fields(array $me, string $t): array
{
  $role = $me['role'];
  if ($role === 'admin') return [];
  if ($t === 'events') return ['partners', 'commission', 'comercial1', 'comercial2', 'share1'];
  if ($t === 'participants' && $role === 'staff') return ['email', 'phone', 'health'];
  return [];
}

function only(array $changed, array $allowed): ?string
{
  $bad = array_diff($changed, $allowed);
  return $bad ? 'Sem permissão para alterar: ' . implode(', ', $bad) . '.' : null;
}

function can_write(array $me, string $t, ?array $old, array $new, array $changed): ?string
{
  $role = $me['role'];
  if ($role === 'admin') return null;
  $prom = in_array($role, ['promotor_chefe', 'promotor'], true);

  switch ($t) {
    case 'participants':
      if (!$old) return 'Sem permissão para criar inscrições.';
      if ($prom) {
        if ($old['eventId'] !== $me['eventId'] || $new['eventId'] !== $me['eventId']) return 'Essa inscrição não é do teu evento.';
        return only($changed, $role === 'promotor_chefe' ? ['name', 'email', 'phone', 'birth', 'type', 'turma', 'diet', 'health', 'tableId', 'password'] : ['tableId']);
      }
      if ($role === 'staff') {
        if (!staff_can($me, $old['eventId'])) return 'Não tens acesso a esse evento.';
        $err = only($changed, ['enteredAt', 'enteredBy']);
        if ($err) return $err;
        if ($new['enteredAt'] !== null) {
          $ev = event_obj($old['eventId']);
          $p = decode_row('participants', $old);
          if (!$ev || !fully_paid($p, $ev, payments_of([$old['id']])[$old['id']] ?? [])) return 'Este participante tem prestações em falta.';
          if ($old['enteredAt']) return 'Este QR já foi usado.';
        }
        return null;
      }
      return 'Sem permissão.';

    case 'payments':
      if (!$prom) return 'Sem permissão para registar pagamentos.';
      if ($old) return 'Um pagamento registado não pode ser alterado: anula-o e regista outra vez.';
      $p = fetch_row('participants', (string)$new['participantId']);
      if (!$p || $p['eventId'] !== $me['eventId']) return 'Essa inscrição não é do teu evento.';
      if ($new['kind'] !== 'payment' && !($new['kind'] === 'adjust' && $role === 'promotor_chefe')) return 'Só o promotor chefe pode acertar diferenças.';
      if (!is_numeric($new['amount']) || $new['amount'] <= 0) return 'Valor inválido.';
      return null;

    case 'events':
      if ($prom && $old && $old['id'] === $me['eventId']) return only($changed, ['tables']);
      return 'Sem permissão para alterar o evento.';

    case 'votes':
      if ($me['kind'] !== 'participant') return 'Só os participantes votam.';
      if ($new['voterId'] !== $me['id'] || $new['eventId'] !== $me['eventId'] || $new['id'] !== $new['awardId'] . ':' . $me['id']) return 'Voto inválido.';
      $ev = event_obj($me['eventId']);
      if (!$ev || !voting_open($ev)) return 'A votação não está aberta.';
      $award = null;
      foreach ($ev['awards'] ?? [] as $a) if ($a['id'] === $new['awardId']) $award = $a;
      if (!$award) return 'Prémio inválido.';
      $ids = [$me['id'], (string)$new['candidateId']];
      $rows = all('SELECT * FROM `participants` WHERE `id` IN (?, ?) AND `eventId` = ?', array_merge($ids, [$me['eventId']]));
      $pay = payments_of($ids);
      $byId = [];
      foreach ($rows as $r) $byId[$r['id']] = decode_row('participants', $r);
      foreach ($ids as $id) if (!isset($byId[$id]) || !fully_paid($byId[$id], $ev, $pay[$id] ?? [])) return 'Só votam e são votados participantes com tudo pago.';
      if (is_array($award['eligible'] ?? null) && !in_array($new['candidateId'], $award['eligible'], true)) return 'Essa pessoa não pode ser votada neste prémio.';
      return null;
  }
  return 'Sem permissão.';
}

function can_delete(array $me, string $t, array $old): ?string
{
  $role = $me['role'];
  if ($role === 'admin') return null;
  if ($t === 'payments' && in_array($role, ['promotor_chefe', 'promotor'], true)) {
    $p = fetch_row('participants', $old['participantId']);
    if (!$p || $p['eventId'] !== $me['eventId']) return 'Esse pagamento não é do teu evento.';
    if ($role === 'promotor' && $old['receivedBy'] !== $me['id']) return 'Só podes anular pagamentos que tu recebeste.';
    return null;
  }
  if ($t === 'votes' && $me['kind'] === 'participant' && $old['voterId'] === $me['id']) {
    $ev = event_obj($me['eventId']);
    return $ev && voting_open($ev) ? null : 'A votação não está aberta.';
  }
  return 'Sem permissão para apagar.';
}

// ---------- Inscrição pública ----------

function public_event(array $e): array
{
  $count = (int)one('SELECT COUNT(*) AS n FROM `participants` WHERE `eventId` = ?', [$e['id']])['n'];
  $o = decode_row('events', $e);
  $o['partners'] = [];
  $o['awards'] = [];
  $o['tables'] = [];
  unset($o['commission'], $o['comercial1'], $o['comercial2'], $o['share1']);
  $o['full'] = !empty($o['capacity']) && $count >= $o['capacity'];
  return $o;
}

function find_event_by_code(string $code): ?array
{
  $e = one('SELECT * FROM `events` WHERE UPPER(`code`) = UPPER(?) AND (`archived` = 0 OR `archived` IS NULL)', [trim($code)]);
  return $e ?: null;
}

function route_event(): void
{
  $e = find_event_by_code((string)($_GET['code'] ?? ''));
  if (!$e) fail(404, 'Não encontrámos nenhum evento com este código. Confirma com a tua comissão de finalistas.');
  out(['event' => public_event($e)]);
}

function route_register(): void
{
  if (too_many_attempts()) fail(429, 'Demasiadas tentativas. Espera 15 minutos.');
  $b = body();
  $e = find_event_by_code((string)($b['code'] ?? ''));
  if (!$e) fail(404, 'Código de evento inválido.');
  $ev = public_event($e);
  if ($ev['full']) fail(409, 'As inscrições para este evento estão fechadas: a lotação foi atingida.');

  $f = fn($k, $max = 200) => mb_substr(trim((string)($b[$k] ?? '')), 0, $max);
  $name = $f('name');
  $email = $f('email');
  $phone = $f('phone', 30);
  $birth = $f('birth', 10);
  $type = $f('type', 20);
  $diet = $f('diet', 60);
  $turma = $f('turma', 40);
  $pass = (string)($b['password'] ?? '');
  if (mb_strlen($name) < 3 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen(preg_replace('/\D/', '', $phone)) < 9 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $birth))
    fail(400, 'Confirma o nome, o email, o telemóvel e a data de nascimento.');
  if (!in_array($type, ['finalista', 'nao_finalista', 'externo'], true) || !$diet) fail(400, 'Escolhe o tipo de participante e a alimentação.');
  if ($turma && !in_array($turma, $ev['classes'] ?? [], true)) $turma = '';
  if (strlen($pass) < 6) fail(400, 'A palavra-passe tem de ter pelo menos 6 caracteres.');
  if (empty($b['consent'])) fail(400, 'Tens de aceitar a política de privacidade.');
  if (one('SELECT 1 FROM `participants` WHERE `eventId` = ? AND LOWER(`email`) = LOWER(?)', [$e['id'], $email]))
    fail(409, 'Já existe uma inscrição com este email neste evento. Faz log-in para entrares na tua área.');

  $id = new_id('p');
  $row = encode_row('participants', [
    'id' => $id, 'eventId' => $e['id'], 'name' => $name, 'birth' => $birth, 'phone' => $phone, 'email' => $email, 'type' => $type,
    'turma' => $turma ?: null, 'diet' => $diet, 'health' => $f('health', 500) ?: null, 'consent' => true, 'createdAt' => now_iso(), 'offer' => false,
    'qr' => 'LD-' . strtoupper($e['code']) . '-' . strtoupper($id),
  ]);
  $row['password'] = password_hash($pass, PASSWORD_DEFAULT);
  $cols = array_keys($row);
  q('INSERT INTO `participants` (`' . implode('`, `', $cols) . '`) VALUES (' . in_list($cols) . ')', array_values($row));
  bump_version();
  out(['token' => issue_token('participant', $id), 'session' => ['kind' => 'participant', 'id' => $id]]);
}
