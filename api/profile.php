<?php
// Perfil editável do usuário e promoção/rebaixamento de cargo pelo admin.

if ($a === 'profile_update') {
  $dn = mb_substr(trim($in['display_name'] ?? $me['n']), 0, 60); $bio = mb_substr(trim($in['bio'] ?? ''), 0, 400);
  $pdo->prepare('UPDATE users SET display_name=?,bio=? WHERE id=?')->execute([$dn, $bio, $me['id']]);
  if (!empty($in['new_pass'])) $pdo->prepare('UPDATE users SET pass=? WHERE id=?')->execute([password_hash($in['new_pass'], PASSWORD_DEFAULT), $me['id']]);
  out(['ok' => 1]);
}
if ($a === 'promote') {
  $uid = (int)($in['user_id'] ?? 0); $role = in_array($in['role'] ?? '', ['admin', 'user']) ? $in['role'] : 'user';
  if ($uid === (int)$me['id'] && $role !== 'admin') out(['err' => 'Você não pode tirar o seu próprio cargo de admin.']);
  $pdo->prepare('UPDATE users SET role=? WHERE id=?')->execute([$role, $uid]);
  out(['ok' => 1]);
}
