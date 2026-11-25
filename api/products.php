<?php
// Tudo sobre produtos do cardápio/lojas: favoritar, editar, estoque, classificação,
// imagens e avaliações. $in, $a, $me, $admin já vêm prontos do roteador (api.php).

if ($a === 'fav') {
  $d = $pdo->prepare('DELETE FROM favs WHERE user_id=? AND product_id=?');
  $d->execute([$me['id'], $in['id'] ?? '']);
  if (!$d->rowCount()) $pdo->prepare('INSERT INTO favs VALUES(?,?)')->execute([$me['id'], $in['id'] ?? '']);
  out(['ok' => 1]);
}
if ($a === 'tog') { $pdo->prepare('UPDATE products SET ok=1-ok WHERE id=?')->execute([$in['id'] ?? '']); out(['ok' => 1]); }
if ($a === 'del') { $pdo->prepare('DELETE FROM products WHERE id=?')->execute([$in['id'] ?? '']); out(['ok' => 1]); }
if ($a === 'add') {
  $name = trim($in['name'] ?? ''); $price = (float)($in['price'] ?? -1);
  if ($name === '' || $price < 0 || !in_array($in['c'] ?? '', ['cafe', 'lembranca', 'tcg'])) out(['err' => 'Preencha nome, preço e categoria.']);
  $pdo->prepare('INSERT INTO products(id,c,g,e,name,d,price,rating_age,stock) VALUES(?,?,?,?,?,?,?,?,?)')
      ->execute(['x' . dechex(time()) . bin2hex(random_bytes(2)), $in['c'], 'Novidades', '🍁', $name, trim($in['d'] ?? ''), $price,
                 $in['rating_age'] ?? 'L', max(0, (int)($in['stock'] ?? 0))]);
  out(['ok' => 1]);
}
if ($a === 'edit_product') {
  $id = $in['id'] ?? '';
  if (!$pdo->query('SELECT id FROM products WHERE id=' . $pdo->quote($id))->fetchColumn()) out(['err' => 'Produto não encontrado.']);
  $name = trim($in['name'] ?? ''); $d = trim($in['d'] ?? ''); $price = $in['price'] ?? null;
  if ($name === '') out(['err' => 'O nome não pode ficar vazio.']);
  if ($price !== null && (float)$price < 0) out(['err' => 'Preço inválido.']);
  $pdo->prepare('UPDATE products SET name=?,d=?,price=? WHERE id=?')
      ->execute([mb_substr($name, 0, 120), mb_substr($d, 0, 2000), $price !== null ? (float)$price : $pdo->query('SELECT price FROM products WHERE id=' . $pdo->quote($id))->fetchColumn(), $id]);
  out(['ok' => 1]);
}
if ($a === 'del_image') {
  $st = $pdo->prepare('SELECT filename FROM product_images WHERE id=?'); $st->execute([$in['id'] ?? 0]);
  if ($f = $st->fetchColumn()) @unlink($UP_DIR . $f);
  $pdo->prepare('DELETE FROM product_images WHERE id=?')->execute([$in['id'] ?? 0]);
  out(['ok' => 1]);
}
if ($a === 'set_rating_age') { $pdo->prepare('UPDATE products SET rating_age=? WHERE id=?')->execute([$in['rating_age'] ?? 'L', $in['id'] ?? '']); out(['ok' => 1]); }
if ($a === 'set_stock') { $pdo->prepare('UPDATE products SET stock=? WHERE id=?')->execute([max(0, (int)($in['stock'] ?? 0)), $in['id'] ?? '']); out(['ok' => 1]); }
if ($a === 'review_add') {
  $pid = $in['product_id'] ?? ''; $rating = max(1, min(5, (int)($in['rating'] ?? 5))); $text = mb_substr(trim($in['text'] ?? ''), 0, 500);
  if (!$pdo->query('SELECT id FROM products WHERE id=' . $pdo->quote($pid))->fetchColumn()) out(['err' => 'Produto não encontrado.']);
  $pdo->prepare('INSERT INTO reviews(product_id,user_id,rating,text,t) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating),text=VALUES(text),t=VALUES(t)')
      ->execute([$pid, $me['id'], $rating, $text, (int)(microtime(true) * 1000)]);
  out(['ok' => 1]);
}
