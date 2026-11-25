<?php
// Envio de arquivos (multipart/form-data): imagens de produto, foto de perfil e música.
// Só é incluído pelo roteador quando a requisição é multipart; sempre termina com out() (exit).
$a = $_POST['a'] ?? '';
if (!$me) out(['err' => 'Entre na sua conta para continuar.']);

$allowExt = ['img' => ['jpg','jpeg','png','gif','webp'], 'music' => ['mp3','ogg','wav']];
function saveUpload($field, $kind, $UP_DIR, $allowExt) {
  if (empty($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) return [null, 'Selecione um arquivo válido.'];
  $f = $_FILES[$field];
  if ($f['size'] > 8 * 1024 * 1024) return [null, 'Arquivo maior que 8 MB.'];
  $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
  if (!in_array($ext, $allowExt[$kind])) return [null, 'Formato não permitido (' . $ext . ').'];
  $name = bin2hex(random_bytes(8)) . '.' . $ext;
  if (!move_uploaded_file($f['tmp_name'], $UP_DIR . $name)) return [null, 'Falha ao salvar o arquivo.'];
  return [$name, null];
}

if ($a === 'upload_image') {
  if (!$admin) out(['err' => 'Apenas o administrador pode enviar imagens de produtos.']);
  $pid = $_POST['product_id'] ?? '';
  if (!$pdo->query('SELECT id FROM products WHERE id=' . $pdo->quote($pid))->fetchColumn()) out(['err' => 'Produto não encontrado.']);
  [$name, $err] = saveUpload('file', 'img', $UP_DIR, $allowExt);
  if ($err) out(['err' => $err]);
  $pdo->prepare('INSERT INTO product_images(product_id,filename,pos) VALUES(?,?,?)')
      ->execute([$pid, $name, (int)$pdo->query('SELECT COUNT(*) FROM product_images WHERE product_id=' . $pdo->quote($pid))->fetchColumn()]);
  out(['ok' => 1]);
}
if ($a === 'upload_avatar') {
  [$name, $err] = saveUpload('file', 'img', $UP_DIR, $allowExt);
  if ($err) out(['err' => $err]);
  $pdo->prepare('UPDATE users SET avatar=? WHERE id=?')->execute([$name, $me['id']]);
  out(['ok' => 1]);
}
if ($a === 'upload_music') {
  if (!$admin) out(['err' => 'Apenas o administrador pode trocar a música.']);
  [$name, $err] = saveUpload('file', 'music', $UP_DIR, $allowExt);
  if ($err) out(['err' => $err]);
  $pdo->prepare('REPLACE INTO settings(k,v) VALUES("music",?)')->execute([$name]);
  out(['ok' => 1]);
}
out(['err' => 'Ação inválida.']);
