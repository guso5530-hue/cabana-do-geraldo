<?php
// Monta o "estado" completo do site para o front-end (ação padrão quando nenhuma
// outra ação casou com $a). Uma única chamada traz produtos, pedidos, fliperama etc.

$prods = $pdo->query('SELECT id,c,g,e,name,d,price,ok,rating_age,stock FROM products ORDER BY pos')->fetchAll();
$imgsByP = []; foreach ($pdo->query('SELECT id,product_id,filename FROM product_images ORDER BY pos') as $r) $imgsByP[$r['product_id']][] = $r;
$revsByP = [];
foreach ($pdo->query('SELECT r.id,r.product_id,r.rating,r.text,r.t,u.id uid,COALESCE(u.display_name,u.name) uname FROM reviews r JOIN users u ON u.id=r.user_id ORDER BY r.t DESC') as $r) $revsByP[$r['product_id']][] = $r;
foreach ($prods as &$p) {
  $p['price'] = (float)$p['price']; $p['ok'] = (int)$p['ok']; $p['stock'] = (int)$p['stock'];
  $p['images'] = $imgsByP[$p['id']] ?? []; $p['reviews'] = $revsByP[$p['id']] ?? [];
} unset($p);

$favs = []; $orders = [];
if ($me) {
  $st = $pdo->prepare('SELECT product_id FROM favs WHERE user_id=?'); $st->execute([$me['id']]); $favs = $st->fetchAll(PDO::FETCH_COLUMN);
  $sql = 'SELECT o.id,u.name AS user,o.total,o.note,o.s,o.t FROM orders o JOIN users u ON u.id=o.user_id'
       . ($admin ? '' : ' WHERE o.user_id=' . (int)$me['id']) . ' ORDER BY o.t DESC';
  $orders = $pdo->query($sql)->fetchAll();
  $it = $pdo->prepare('SELECT name,q,price FROM order_items WHERE order_id=?');
  foreach ($orders as &$o) { $o['total'] = (float)$o['total']; $o['s'] = (int)$o['s']; $o['t'] = (int)$o['t']; $it->execute([$o['id']]); $o['items'] = $it->fetchAll(); } unset($o);
}

$myFavMachines = $me ? $pdo->query('SELECT machine_id FROM arcade_favs WHERE user_id=' . (int)$me['id'])->fetchAll(PDO::FETCH_COLUMN) : [];
$favCounts = []; foreach ($pdo->query('SELECT machine_id,COUNT(*) c FROM arcade_favs GROUP BY machine_id') as $r) $favCounts[$r['machine_id']] = (int)$r['c'];
$arcade = $pdo->query('SELECT id,e,name,d,game FROM arcade_machines ORDER BY pos')->fetchAll();
$topFavs = $favCounts ? max($favCounts) : 0;
foreach ($arcade as &$m) {
  $m['favs'] = $favCounts[$m['id']] ?? 0;
  $m['myFav'] = in_array($m['id'], $myFavMachines);
  $m['top'] = $topFavs > 0 && $m['favs'] === $topFavs;
  $m['game'] = $m['game'] ?? '';
} unset($m);

$mural = $pdo->query('SELECT m.product_id,m.note,p.name pname,p.e pe,m.client_user_id,COALESCE(u.display_name,u.name) cname FROM mural m LEFT JOIN products p ON p.id=m.product_id LEFT JOIN users u ON u.id=m.client_user_id WHERE m.id=1')->fetch();
$music = $pdo->query('SELECT v FROM settings WHERE k="music"')->fetchColumn() ?: null;

$users = $sales = [];
if ($admin) {
  $users = $pdo->query('SELECT id,name,role,COALESCE(display_name,name) dn FROM users ORDER BY name')->fetchAll();
  $sales = $pdo->query('SELECT product_id,name,SUM(q) qtd,SUM(q*price) rev FROM order_items GROUP BY product_id,name ORDER BY rev DESC')->fetchAll();
  foreach ($sales as &$s) { $s['qtd'] = (int)$s['qtd']; $s['rev'] = (float)$s['rev']; } unset($s);
}

out(['me' => $me ? ['id' => $me['id'], 'n' => $me['n'], 'r' => $me['r'], 'dn' => $me['dn'], 'bio' => $me['bio'], 'avatar' => $me['avatar'], 'tickets' => (int)$me['tickets']] : null,
     'products' => $prods, 'favs' => $favs, 'orders' => $orders, 'mural' => $mural, 'music' => $music,
     'users' => $users, 'sales' => $sales, 'arcade' => $arcade]);
