<?php
// Fliperama: máquinas cadastráveis pelo admin, favoritos dos clientes (define o
// "mais procurado") e o uso de fichas universais escolhendo o jogo na hora.

if ($a === 'arcade_add') {
  $name = trim($in['name'] ?? ''); if ($name === '') out(['err' => 'Dê um nome para a máquina.']);
  $pos = (int)$pdo->query('SELECT COUNT(*) FROM arcade_machines')->fetchColumn();
  $game = trim($in['game'] ?? '');
  if (!in_array($game, ['', 'hordas', 'doom', 'mario'], true)) $game = '';
  $pdo->prepare('INSERT INTO arcade_machines(pos,e,name,d,game) VALUES(?,?,?,?,?)')
      ->execute([$pos, mb_substr(trim($in['e'] ?? '🕹️'), 0, 12) ?: '🕹️', mb_substr($name, 0, 120), mb_substr(trim($in['d'] ?? ''), 0, 2000), $game]);
  out(['ok' => 1]);
}
if ($a === 'arcade_del') { $pdo->prepare('DELETE FROM arcade_machines WHERE id=?')->execute([(int)($in['id'] ?? 0)]); out(['ok' => 1]); }

if ($a === 'arcade_fav') {
  if (!$me) out(['err' => 'Entre na sua conta para favoritar um jogo.']);
  $mid = (int)($in['machine_id'] ?? 0);
  $d = $pdo->prepare('DELETE FROM arcade_favs WHERE user_id=? AND machine_id=?'); $d->execute([$me['id'], $mid]);
  if (!$d->rowCount()) $pdo->prepare('INSERT INTO arcade_favs VALUES(?,?)')->execute([$me['id'], $mid]);
  out(['ok' => 1]);
}
if ($a === 'arcade_use') {
  if (!$me) out(['err' => 'Entre na sua conta para usar uma ficha.']);
  $mid = (int)($in['machine_id'] ?? 0);
  if (!$pdo->query('SELECT id FROM arcade_machines WHERE id=' . (int)$mid)->fetchColumn()) out(['err' => 'Escolha uma máquina válida.']);
  if ((int)$me['tickets'] <= 0) out(['err' => 'Você não tem fichas. Compre um pacote de fichas na cafeteria.']);
  $pdo->prepare('UPDATE users SET tickets=tickets-1 WHERE id=?')->execute([$me['id']]);
  $pdo->prepare('INSERT INTO arcade_plays(user_id,machine_id,t) VALUES(?,?,?)')->execute([$me['id'], $mid, (int)(microtime(true) * 1000)]);
  out(['ok' => 1, 'tickets' => (int)$me['tickets'] - 1]);
}
