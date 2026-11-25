<?php
// Carrinho/pedido e status. Quando o pedido inclui o produto "fichas", credita fichas
// universais na conta do cliente (cada pacote = 5 fichas), para usar em qualquer máquina.
const FICHAS_POR_PACOTE = 5;

if ($a === 'order') {
  $rows = []; $tot = 0; $ticketsToCredit = 0;
  foreach (($in['items'] ?? []) as $i) {
    $st = $pdo->prepare('SELECT * FROM products WHERE id=? AND ok=1');
    $st->execute([$i['id'] ?? '']);
    $p = $st->fetch();
    if (!$p) continue;
    $q = max(1, min(50, (int)($i['q'] ?? 1)));
    $q = min($q, max(0, (int)$p['stock']));
    if ($q <= 0) continue;
    $rows[] = [$p['id'], $p['name'], $q, $p['price']];
    $tot += $q * $p['price'];
    if ($p['id'] === 'fichas') $ticketsToCredit += $q * FICHAS_POR_PACOTE;
  }
  if (!$rows) out(['err' => 'Carrinho vazio ou itens sem estoque suficiente.']);
  $id = '#' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
  $pdo->beginTransaction();
  $pdo->prepare('INSERT INTO orders(id,user_id,total,note,s,t) VALUES(?,?,?,?,0,?)')
      ->execute([$id, $me['id'], $tot, mb_substr(trim($in['note'] ?? ''), 0, 120), (int)(microtime(true) * 1000)]);
  $ins = $pdo->prepare('INSERT INTO order_items(order_id,product_id,name,q,price) VALUES(?,?,?,?,?)');
  $upd = $pdo->prepare('UPDATE products SET stock=stock-? WHERE id=?');
  foreach ($rows as $r) { $ins->execute([$id, $r[0], $r[1], $r[2], $r[3]]); $upd->execute([$r[2], $r[0]]); }
  if ($ticketsToCredit > 0) $pdo->prepare('UPDATE users SET tickets=tickets+? WHERE id=?')->execute([$ticketsToCredit, $me['id']]);
  $pdo->commit();
  out(['id' => $id, 'tickets_ganhos' => $ticketsToCredit]);
}
if ($a === 'status') { $pdo->prepare('UPDATE orders SET s=? WHERE id=?')->execute([max(0, min(3, (int)($in['s'] ?? 0))), $in['id'] ?? '']); out(['ok' => 1]); }
