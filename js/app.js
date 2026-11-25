// Renderização da página, eventos de clique/formulário, e o controle dos
// componentes do Bootstrap (modal de login, offcanvas do carrinho, música).

function toast(m) {
  clearTimeout(window.toastT);
  document.querySelectorAll('.toast-cg').forEach(t => t.remove());
  const d = document.createElement('div');
  d.className = 'toast-cg position-fixed bottom-0 start-50 translate-middle-x mb-4 btn btn-warning fw-bold shadow';
  d.setAttribute('role', 'status');
  d.textContent = m;
  document.body.append(d);
  window.toastT = setTimeout(() => d.remove(), 2200);
}

const loginModal = new bootstrap.Modal('#loginModal');
const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance('#cartOffcanvas');
function askLogin(msg) {
  $('#lmsg').textContent = msg || 'Use seu nome de usuário e senha.';
  $('#lerr').textContent = '';
  loginModal.show();
  setTimeout(() => $('#un').focus(), 300);
}

const addCart = id => { const p = find(id); if (!p || !p.ok || p.stock <= 0) return; cart[id] = (cart[id] || 0) + 1; toast(p.name + ' no carrinho'); render(); };

function renderCart() {
  const ids = Object.keys(cart).filter(id => find(id));
  const tot = ids.reduce((a, id) => a + find(id).price * cart[id], 0);
  $('#cartBody').innerHTML = `
  <div class="mb-3">${ids.length ? ids.map(id => { const p = find(id); return `<div class="d-flex justify-content-between align-items-center border-bottom border-secondary-subtle py-2"><span>${p.e} ${esc(p.name)}<br><small class="text-secondary">${brl(p.price)}</small></span><span class="d-flex align-items-center gap-2"><button class="btn btn-sm btn-outline-light" data-dec="${id}" aria-label="Diminuir">−</button>${cart[id]}<button class="btn btn-sm btn-outline-light" data-inc="${id}" aria-label="Aumentar">+</button></span></div>`; }).join('') : '<p class="text-secondary">Seu carrinho está vazio. Adicione algo do cardápio.</p>'}</div>
  <label for="note" class="form-label">Mesa ou nome para retirada</label><input id="note" class="form-control mb-3" placeholder="Ex.: mesa 4">
  <div class="d-flex justify-content-between align-items-center"><b>Total: ${brl(tot)}</b><button class="btn btn-warning fw-bold" data-act="checkout" ${ids.length ? '' : 'disabled'}>Fazer pedido</button></div>`;
}

function render() {
  const h = cur(), v = h.startsWith('p/') ? null : (VIEWS.includes(h) ? h : 'inicio');
  $('#nav').innerHTML = VIEWS.filter(x => x !== 'inicio' && (x !== 'painel' || (me && me.r === 'admin')) && ((x !== 'pedidos' && x !== 'perfil') || me))
    .map(x => `<button class="btn btn-sm ${x === v ? 'btn-warning fw-bold' : 'btn-link text-light text-decoration-none'}" data-go="${x}">${LABEL[x]}</button>`).join('');
  $('#who').innerHTML = (me
    ? `<span class="text-light small d-none d-sm-inline">Olá, <b>${esc(me.dn || me.n)}</b>${me.r === 'admin' ? ' (admin)' : ''}</span><button class="btn btn-sm btn-outline-light" data-act="logout">Sair</button>`
    : `<button class="btn btn-sm btn-warning fw-bold" data-act="login">Entrar</button>`)
    + `<button class="btn btn-sm btn-outline-warning" data-bs-toggle="offcanvas" data-bs-target="#cartOffcanvas" aria-label="Abrir carrinho">🛒 ${cartCount()}</button>`;
  $('#app').innerHTML = v ? V[v]() : productView(h.slice(2));
  renderCart();
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-add],[data-fav],[data-inc],[data-dec],[data-act],[data-tog],[data-del],[data-delimg],[data-upimg],[data-setstock],[data-promote],[data-arcdel],[data-arcfav],[data-arcuse]');
  if (!t) return;
  const d = t.dataset;
  if (d.go) go(d.go);
  else if (d.add) addCart(d.add);
  else if (d.fav) { if (!me) return askLogin('Entre para favoritar itens da loja.'); api('fav', {id: d.fav}).then(load); }
  else if (d.inc) { cart[d.inc]++; render(); }
  else if (d.dec) { if (--cart[d.dec] <= 0) delete cart[d.dec]; render(); }
  else if (d.tog) api('tog', {id: d.tog}).then(load);
  else if (d.del) { delete cart[d.del]; api('del', {id: d.del}).then(() => { go('painel'); load(); }); }
  else if (d.delimg) api('del_image', {id: d.delimg}).then(load);
  else if (d.upimg) { const f = $('#imgIn').files[0]; if (!f) return toast('Escolha uma imagem primeiro.'); upload('upload_image', 'file', f, {product_id: d.upimg}).then(r => { if (r.err) return toast(r.err); toast('Imagem enviada!'); load(); }); }
  else if (d.setstock) api('set_stock', {id: d.setstock, stock: +$('#stkIn').value}).then(() => { toast('Estoque atualizado'); load(); });
  else if (d.arcdel) api('arcade_del', {id: d.arcdel}).then(load);
  else if (d.arcfav) { if (!me) return askLogin('Entre para favoritar um jogo.'); api('arcade_fav', {machine_id: d.arcfav}).then(r => { if (r.err) return toast(r.err); load(); }); }
  else if (d.arcuse) { if (!me) return askLogin('Entre para usar uma ficha.'); api('arcade_use', {machine_id: d.arcuse}).then(r => { if (r.err) return toast(r.err); const m = S.arcade.find(x => x.id == d.arcuse); toast('Ficha usada! Bom jogo.'); load().then(() => { if (m && m.game) openGame(m.game, m.id); }); }); }
  else if (d.promote) { const [uid, role] = d.promote.split(':'); api('promote', {user_id: uid, role}).then(r => { if (r.err) return toast(r.err); load(); }); }
  else if (d.act === 'login') askLogin();
  else if (d.act === 'logout') api('logout').then(() => { cart = {}; toast('Você saiu da conta'); load().then(() => { if (['pedidos', 'painel', 'favoritos', 'perfil'].includes(cur())) go('inicio'); }); });
  else if (d.act === 'upav') { const f = $('#avIn').files[0]; if (!f) return toast('Escolha uma foto primeiro.'); upload('upload_avatar', 'file', f).then(r => { if (r.err) return toast(r.err); toast('Foto atualizada!'); load(); }); }
  else if (d.act === 'upmusic') { const f = $('#musIn').files[0]; if (!f) return toast('Escolha um arquivo de áudio.'); upload('upload_music', 'file', f).then(r => { if (r.err) return toast(r.err); toast('Música atualizada!'); load(); }); }
  else if (d.act === 'checkout') {
    if (!me) { cartOffcanvas.hide(); return askLogin('Entre para finalizar o pedido.'); }
    const items = Object.keys(cart).map(id => ({id, q: cart[id]}));
    if (!items.length) return;
    api('order', {items, note: $('#note').value.trim()}).then(r => { if (r.err) return toast(r.err); cart = {}; cartOffcanvas.hide(); toast('Pedido ' + r.id + ' enviado!'); load().then(() => go('pedidos')); });
  }
});

document.addEventListener('change', e => {
  if (e.target.dataset.st) api('status', {id: e.target.dataset.st, s: +e.target.value}).then(load);
  else if (e.target.id === 'raSel') api('set_rating_age', {id: e.target.dataset.setra, rating_age: e.target.value}).then(load);
  else if (e.target.dataset.quickimg) { const f = e.target.files[0]; if (!f) return; upload('upload_image', 'file', f, {product_id: e.target.dataset.quickimg}).then(r => { if (r.err) return toast(r.err); toast('Foto adicionada!'); load(); }); }
});

document.addEventListener('submit', e => {
  if (e.target.id === 'pf') { e.preventDefault(); api('add', {name: $('#pn').value.trim(), d: $('#pd').value.trim(), price: +$('#pp').value, c: $('#pc').value, stock: +$('#pst').value, rating_age: $('#pra').value}).then(r => { if (r.err) return toast(r.err); toast('Produto adicionado'); load(); }); }
  else if (e.target.id === 'editF') { e.preventDefault(); api('edit_product', {id: e.target.dataset.pid, name: $('#enome').value.trim(), d: $('#edesc').value.trim(), price: +$('#eprice').value}).then(r => { if (r.err) return toast(r.err); toast('Produto atualizado!'); load(); }); }
  else if (e.target.id === 'rf') { e.preventDefault(); api('review_add', {product_id: e.target.dataset.pid, rating: +$('#rv').value, text: $('#rt').value.trim()}).then(r => { if (r.err) return toast(r.err); toast('Avaliação enviada!'); load(); }); }
  else if (e.target.id === 'pf2') { e.preventDefault(); api('profile_update', {display_name: $('#dn').value.trim(), bio: $('#bio').value.trim(), new_pass: $('#np').value}).then(r => { if (r.err) return toast(r.err); toast('Perfil salvo!'); load(); }); }
  else if (e.target.id === 'arcF') { e.preventDefault(); api('arcade_add', {e: $('#ame').value.trim(), name: $('#anm').value.trim(), d: $('#adsc').value.trim(), game: $('#agm').value}).then(r => { if (r.err) return toast(r.err); toast('Máquina adicionada!'); e.target.reset(); load(); }); }
  else if (e.target.id === 'muralF') { e.preventDefault(); api('mural_set', {product_id: $('#muralP').value, client_user_id: $('#muralC').value, note: $('#muralN').value.trim()}).then(r => { if (r.err) return toast(r.err); toast('Mural atualizado!'); load(); }); }
});

$('#lf').addEventListener('submit', e => {
  e.preventDefault();
  api('login', {n: $('#un').value.trim(), p: $('#pw').value}).then(r => {
    if (r.err) { $('#lerr').textContent = r.err; return; }
    loginModal.hide(); $('#lf').reset(); toast('Bem-vindo!'); load();
  });
});

const player = $('#player'), musicBtn = $('#musicBtn');
function setMusicUI(on) {
  musicBtn.textContent = on ? '🔊' : '🔇';
  musicBtn.setAttribute('aria-pressed', String(on));
}
function syncMusic() {
  const src = S.music ? 'uploads/' + S.music : '';
  if (src && player.getAttribute('src') !== src) { player.src = src; player.load(); }
  const on = localStorage.getItem('cg_music') === 'on' && !!S.music;
  setMusicUI(on);
  if (on) player.play().catch(() => { localStorage.setItem('cg_music', 'off'); setMusicUI(false); });
}
musicBtn.addEventListener('click', () => {
  const on = localStorage.getItem('cg_music') === 'on';
  if (on) { player.pause(); localStorage.setItem('cg_music', 'off'); return setMusicUI(false); }
  if (!S.music) return toast('O admin ainda não enviou uma música.');
  if (!player.getAttribute('src')) { player.src = 'uploads/' + S.music; player.load(); }
  player.play()
    .then(() => { localStorage.setItem('cg_music', 'on'); setMusicUI(true); })
    .catch(() => toast('O navegador bloqueou o áudio. Clique de novo para tentar.'));
});

window.addEventListener('hashchange', render);
load();
