// Pequenas funções de apoio e de comunicação com o servidor (api.php).
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = n => Number(n).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

// Chama uma ação da API via JSON (login, favoritar, pedidos, etc.)
const api = async (a, d = {}) => {
  try {
    const r = await fetch('api.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({a, ...d})});
    return await r.json();
  } catch (e) {
    return {err: 'Não foi possível falar com o servidor. Confira se o Apache e o MySQL estão ligados no XAMPP.'};
  }
};

// Envia um arquivo (imagem de produto, foto de perfil, música) via multipart/form-data
const upload = async (a, field, file, extra = {}) => {
  const fd = new FormData();
  fd.append('a', a); fd.append(field, file);
  for (const k in extra) fd.append(k, extra[k]);
  try {
    const r = await fetch('api.php', {method:'POST', body: fd});
    return await r.json();
  } catch (e) {
    return {err: 'Falha ao enviar o arquivo.'};
  }
};
