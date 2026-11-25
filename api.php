<?php
// Roteador da API: lê a requisição, carrega conexão/sessão e repassa a ação ($a)
// para o arquivo responsável. Cada arquivo chamado termina a resposta com out();
// se nenhum deles casar com a ação, state.php devolve o estado completo (padrão).
require __DIR__ . '/api/db.php';   // $pdo, $UP_DIR, out(), schema e seed

$ct = $_SERVER['CONTENT_TYPE'] ?? '';
$isMultipart = stripos($ct, 'multipart') !== false;
if ($isMultipart) { $in = []; $a = $_POST['a'] ?? ''; }
else { $in = json_decode(file_get_contents('php://input'), true) ?: []; $a = $in['a'] ?? 'state'; }

require __DIR__ . '/api/auth.php'; // $me, $admin; trata login/logout e sai (exit)

if ($isMultipart) { require __DIR__ . '/api/uploads.php'; } // trata tudo e sai (exit)

$needLogin = ['fav', 'order', 'review_add', 'profile_update', 'arcade_fav', 'arcade_use'];
$needAdmin = ['status', 'tog', 'del', 'add', 'del_image', 'set_rating_age', 'set_stock', 'promote',
              'mural_set', 'edit_product', 'arcade_add', 'arcade_del'];
if (in_array($a, $needLogin) && !$me) out(['err' => 'Entre na sua conta para continuar.']);
if (in_array($a, $needAdmin) && !$admin) out(['err' => 'Apenas o administrador pode fazer isso.']);

require __DIR__ . '/api/products.php';
require __DIR__ . '/api/orders.php';
require __DIR__ . '/api/profile.php';
require __DIR__ . '/api/mural.php';
require __DIR__ . '/api/arcade.php';
require __DIR__ . '/api/state.php'; // ação padrão ("state"): monta e devolve tudo
