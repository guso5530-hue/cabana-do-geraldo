<?php
// Conexão com o MySQL, criação/migração das tabelas e dados iniciais (seed).
$DB_HOST = '127.0.0.1'; $DB_USER = 'root'; $DB_PASS = ''; $DB_NAME = 'cabana_geraldo';
$UP_DIR = __DIR__ . '/../uploads/';
if (!is_dir($UP_DIR)) @mkdir($UP_DIR, 0775, true);

header('Content-Type: application/json; charset=utf-8');
function out($d){ echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

try {
  $pdo = new PDO("mysql:host=$DB_HOST;charset=utf8mb4", $DB_USER, $DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  $pdo->exec("CREATE DATABASE IF NOT EXISTS `$DB_NAME` CHARACTER SET utf8mb4");
  $pdo->exec("USE `$DB_NAME`");
} catch (Throwable $e) {
  http_response_code(500);
  out(['err' => 'Não foi possível conectar ao MySQL. Ligue o MySQL no painel do XAMPP.']);
}

foreach ([
  'CREATE TABLE IF NOT EXISTS users(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(40) UNIQUE,pass VARCHAR(255),role VARCHAR(10),display_name VARCHAR(60),bio TEXT,avatar VARCHAR(255),tickets INT DEFAULT 0) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS products(id VARCHAR(20) PRIMARY KEY,pos INT AUTO_INCREMENT UNIQUE,c VARCHAR(20),g VARCHAR(40),e VARCHAR(12),name VARCHAR(120),d TEXT,price DECIMAL(8,2),ok TINYINT DEFAULT 1,rating_age VARCHAR(5) DEFAULT "L",stock INT DEFAULT 50) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS product_images(id INT AUTO_INCREMENT PRIMARY KEY,product_id VARCHAR(20),filename VARCHAR(255),pos INT) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS reviews(id INT AUTO_INCREMENT PRIMARY KEY,product_id VARCHAR(20),user_id INT,rating TINYINT,text TEXT,t BIGINT,UNIQUE KEY uq(product_id,user_id)) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS favs(user_id INT,product_id VARCHAR(20),PRIMARY KEY(user_id,product_id)) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS orders(id VARCHAR(20) PRIMARY KEY,user_id INT,total DECIMAL(8,2),note VARCHAR(120),s TINYINT DEFAULT 0,t BIGINT) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS order_items(id INT AUTO_INCREMENT PRIMARY KEY,order_id VARCHAR(20),product_id VARCHAR(20),name VARCHAR(120),q INT,price DECIMAL(8,2)) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS mural(id TINYINT PRIMARY KEY,product_id VARCHAR(20),client_user_id INT,note VARCHAR(200),t BIGINT) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS settings(k VARCHAR(40) PRIMARY KEY,v TEXT) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS arcade_machines(id INT AUTO_INCREMENT PRIMARY KEY,pos INT,e VARCHAR(12),name VARCHAR(120),d TEXT) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS arcade_favs(user_id INT,machine_id INT,PRIMARY KEY(user_id,machine_id)) DEFAULT CHARSET utf8mb4',
  'CREATE TABLE IF NOT EXISTS arcade_plays(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,machine_id INT,t BIGINT) DEFAULT CHARSET utf8mb4',
] as $q) $pdo->exec($q);

// migrações leves, para bancos criados por uma versão anterior do site
foreach ([
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(60)',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255)',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS tickets INT DEFAULT 0',
  'ALTER TABLE products ADD COLUMN IF NOT EXISTS rating_age VARCHAR(5) DEFAULT "L"',
  'ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 50',
  'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id VARCHAR(20)',
  'ALTER TABLE arcade_machines ADD COLUMN IF NOT EXISTS game VARCHAR(20) DEFAULT ""',
] as $q) { try { $pdo->exec($q); } catch (Throwable $e) {} }
$pdo->exec('INSERT IGNORE INTO mural(id,t) VALUES(1,0)');

if (!$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn()) {
  $st = $pdo->prepare('INSERT INTO users(name,pass,role,display_name) VALUES(?,?,?,?)');
  $st->execute(['geraldo', password_hash('cabana123', PASSWORD_DEFAULT), 'admin', 'Geraldo']);
  $st->execute(['visitante', password_hash('orvalho123', PASSWORD_DEFAULT), 'user', 'Visitante']);
}
if (!$pdo->query('SELECT COUNT(*) FROM products')->fetchColumn()) {
  $seed = [
    ['milk','cafe','Bebidas','🥤','Milkshake Vale do Orvalho','Nosso carro-chefe: baunilha, xarope de bordo, chantilly e um fio de caramelo.',24],
    ['choc','cafe','Bebidas','☕','Chocolate quente de bordo','Chocolate cremoso adoçado com xarope de bordo.',14],
    ['cafe','cafe','Bebidas','🍂','Café com xarope de bordo','Café coado na hora, com uma colher de xarope.',10],
    ['panq','cafe','Comidas do norte','🥞','Panquecas com xarope de bordo','Pilha de três panquecas com manteiga e muito xarope canadense.',28],
    ['pout','cafe','Comidas do norte','🍟','Poutine da Cabana','Batatas fritas, queijo em grãos e molho gravy quente.',32],
    ['tour','cafe','Comidas do norte','🥧','Tourtière','Torta quente de carne e especiarias, receita do Quebec.',30],
    ['beav','cafe','Comidas do norte','🍩','Cauda de castor','Massa frita e achatada com açúcar, canela e xarope.',16],
    ['butt','cafe','Doces','🍯','Butter tart','Tortinha de manteiga e xarope com massa crocante.',12],
    ['nana','cafe','Doces','🍫','Barra Nanaimo','Camadas de coco, creme de baunilha e chocolate.',13],
    ['frasco','lembranca','Lembrancinhas','🍁','Frasco de xarope de bordo 250 ml','Xarope canadense puro para levar para casa.',45],
    ['caneca','lembranca','Lembrancinhas','🪵','Caneca Cabana do Geraldo','Caneca de cerâmica com a nossa cabana desenhada.',38],
    ['chave','lembranca','Lembrancinhas','🫎','Chaveiro de alce','Alce de madeira entalhado, feito à mão.',18],
    ['ima','lembranca','Lembrancinhas','🍂','Ímã folha de bordo','Para enfeitar a geladeira com um pouco de outono.',10],
    ['manta','lembranca','Lembrancinhas','🧣','Manta xadrez','Manta quente para as noites frias.',120],
    ['vela','lembranca','Lembrancinhas','🕯️','Vela de floresta','Aroma de pinho e madeira queimada.',35],
    ['fichas','lembranca','Fliperama','🪙','Pacote com 5 fichas','Fichas universais: servem para qualquer máquina do fliperama. Cada pacote dá 5 fichas.',20],
    ['pkb','tcg','Pokémon','🎴','Booster Pokémon','Pacote com cartas Pokémon para abrir na mesa.',28],
    ['pke','tcg','Pokémon','📦','Elite Trainer Box Pokémon','Caixa com boosters, dados, marcadores e sleeves.',380],
    ['ygb','tcg','Yu-Gi-Oh!','🃏','Booster Yu-Gi-Oh!','Pacote de cartas Yu-Gi-Oh! para montar o seu deck.',25],
    ['ygs','tcg','Yu-Gi-Oh!','🐉','Structure Deck Yu-Gi-Oh!','Deck pronto para duelar logo após abrir.',95],
    ['sleeve','tcg','Acessórios','🛡️','Sleeves 65 unidades','Protetores de cartas em tamanho padrão.',30],
    ['box','tcg','Acessórios','🧰','Deck box de madeira','Guarda até 100 cartas com sleeves.',55],
  ];
  $st = $pdo->prepare('INSERT INTO products(id,c,g,e,name,d,price) VALUES(?,?,?,?,?,?,?)');
  foreach ($seed as $r) $st->execute($r);
}
if (!$pdo->query('SELECT COUNT(*) FROM arcade_machines')->fetchColumn()) {
  $pdo->prepare('INSERT INTO arcade_machines(pos,e,name,d) VALUES(0,?,?,?)')
      ->execute(['🎮', 'Gabinete principal', 'O gabinete de destaque da cabana, sempre com um jogo em alta para os clientes curtirem entre um gole de milkshake e outro.']);
}

// Máquinas jogáveis da cabana (inseridas uma única vez, para não reaparecerem se o admin as apagar).
if (!$pdo->query('SELECT v FROM settings WHERE k="arcade_builtins"')->fetchColumn()) {
  foreach ([
    ['🧟', 'Horda da Cabana', 'Sobreviva à maré de criaturas da floresta. Os tiros são automáticos: só corra, suba de nível e aguente mais um pouco.', 'hordas'],
    ['👹', 'Doom do Geraldo', 'Labirinto retro, demônios e munição limitada. Atire, recarregue e limpe os corredores antes que a saúde acabe.', 'doom'],
    ['🍄', 'Orvalho Jump', 'Corra, pule, pegue moedas e pise nos cogumelos até chegar à bandeira da cabana.', 'mario'],
  ] as $g) {
    $st = $pdo->prepare('SELECT id FROM arcade_machines WHERE game=?'); $st->execute([$g[3]]);
    if (!$st->fetchColumn()) {
      $pos = (int)$pdo->query('SELECT COALESCE(MAX(pos),-1)+1 FROM arcade_machines')->fetchColumn();
      $pdo->prepare('INSERT INTO arcade_machines(pos,e,name,d,game) VALUES(?,?,?,?,?)')->execute([$pos, $g[0], $g[1], $g[2], $g[3]]);
    }
  }
  $pdo->exec('REPLACE INTO settings(k,v) VALUES("arcade_builtins","1")');
}
