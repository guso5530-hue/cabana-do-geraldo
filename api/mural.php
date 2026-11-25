<?php
// Mural da semana: produto do mês, cliente do mês e recado da casa.

if ($a === 'mural_set') {
  $pdo->prepare('REPLACE INTO mural(id,product_id,client_user_id,note,t) VALUES(1,?,?,?,?)')
      ->execute([$in['product_id'] ?: null, $in['client_user_id'] ?: null, mb_substr(trim($in['note'] ?? ''), 0, 200), (int)(microtime(true) * 1000)]);
  out(['ok' => 1]);
}
