<?php
// Sessão, quem está logado (e se é admin), e as ações login/logout.
// Espera que $in e $a já tenham sido lidos pelo api.php (o roteador).
session_start();
$me = null;
if (!empty($_SESSION['uid'])) {
  $st = $pdo->prepare('SELECT id,name AS n,role AS r,COALESCE(display_name,name) AS dn,bio,avatar,tickets FROM users WHERE id=?');
  $st->execute([$_SESSION['uid']]);
  $me = $st->fetch() ?: null;
}
$admin = $me && $me['r'] === 'admin';

if ($a === 'login') {
  $st = $pdo->prepare('SELECT * FROM users WHERE name=?');
  $st->execute([strtolower(trim($in['n'] ?? ''))]);
  $u = $st->fetch();
  if (!$u || !password_verify($in['p'] ?? '', $u['pass'])) out(['err' => 'Usuário ou senha incorretos. Confira e tente de novo.']);
  session_regenerate_id(true);
  $_SESSION['uid'] = $u['id'];
  out(['ok' => 1]);
}
if ($a === 'logout') { session_destroy(); out(['ok' => 1]); }
