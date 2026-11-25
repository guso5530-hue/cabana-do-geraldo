// Funções que geram o HTML de cada tela, usando componentes do Bootstrap
// (card, row/col, table, form-control...) por cima do tema em css/tema.css.

function badge(ra) {
  ra = ra || 'L';
  const k = ra === 'L' ? 'L' : 'n' + ra;
  const cls = {L:'bg-success', n10:'bg-warning text-dark', n12:'bg-warning text-dark', n14:'bg-danger', n16:'bg-danger', n18:'bg-dark border border-danger text-danger'}[k] || 'bg-success';
  return `<span class="badge ${cls}">${AGE[k] || ra}</span>`;
}

// Imagem do produto em campo quadrado e do mesmo tamanho para todos os cards;
// sem foto, mostra um aviso "Sem foto" em vez do emoji.
function squareImage(images, emptyIcon) {
  if (images && images[0]) {
    return `<img src="uploads/${esc(images[0].filename)}" class="w-100 h-100 object-fit-cover" alt="">`;
  }
  return `<div class="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-secondary-subtle text-secondary-emphasis">
    <span class="fs-1">${emptyIcon || '🖼️'}</span><span class="small">Sem foto</span></div>`;
}

function card(p) {
  const f = favs().includes(p.id), a = avg(p), low = p.ok && p.stock <= 0;
  const quick = (me && me.r === 'admin')
    ? `<label class="btn btn-outline-warning btn-sm w-100 mt-2">📷 Adicionar foto<input type="file" accept="image/*" data-quickimg="${p.id}" class="d-none"></label>` : '';
  return `<div class="col">
    <div class="card bg-cabana text-light h-100">
      <div class="ratio ratio-1x1">${squareImage(p.images, p.e)}</div>
      <div class="card-body d-flex flex-column">
        <button class="btn btn-link p-0 text-start text-decoration-none text-warning fw-bold mb-1" data-go="p/${p.id}">${esc(p.name)}</button>
        <div class="mb-2">${badge(p.rating_age)} ${a ? `<span class="text-warning small">★ ${a.toFixed(1)} (${p.reviews.length})</span>` : '<span class="text-secondary small">Sem avaliações</span>'}</div>
        <p class="text-secondary small flex-grow-1">${esc(p.d)}</p>
        <div class="d-flex justify-content-between align-items-center">
          <b>${brl(p.price)}</b>
          <div class="d-flex gap-1">
            <button class="btn btn-sm ${f ? 'btn-danger' : 'btn-outline-secondary'} rounded-circle" data-fav="${p.id}" aria-pressed="${f}" aria-label="Favoritar ${esc(p.name)}">♥</button>
            <button class="btn btn-sm btn-warning fw-bold" data-add="${p.id}" ${p.ok && !low ? '' : 'disabled'}>${low ? 'Sem estoque' : p.ok ? 'Adicionar' : 'Esgotado'}</button>
          </div>
        </div>
        ${quick}
      </div>
    </div>
  </div>`;
}

function list(c, t, intro) {
  const ps = S.products.filter(p => p.c === c), gs = [...new Set(ps.map(p => p.g))];
  return `<h2 class="text-warning">${t}</h2><p class="text-secondary">${intro}</p>` +
    gs.map(g => `<h3 class="gt">${esc(g)}</h3><div class="row produtos-grade g-3 mb-4">${ps.filter(p => p.g === g).map(card).join('')}</div>`).join('');
}

function orderHTML(o, adm) {
  return `<div class="card bg-cabana text-light mb-3"><div class="card-body">
    <div class="d-flex justify-content-between flex-wrap gap-2">
      <b>Pedido ${esc(o.id)}</b><span class="text-secondary small">${esc(o.user)} em ${new Date(o.t).toLocaleString('pt-BR')}</span>
    </div>
    <ul class="mb-1">${o.items.map(i => `<li>${i.q}× ${esc(i.name)}</li>`).join('')}</ul>
    <div class="text-secondary small">Retirada: ${esc(o.note || 'balcão')}</div>
    <div class="d-flex justify-content-between align-items-center mt-2">
      <b>${brl(o.total)}</b>
      ${adm
        ? `<select class="form-select form-select-sm w-auto" data-st="${o.id}" aria-label="Status do pedido">${ST.map((s, i) => `<option value="${i}" ${i === o.s ? 'selected' : ''}>${s}</option>`).join('')}</select>`
        : `<span class="badge bg-success">${ST[o.s]}</span>`}
    </div>
  </div></div>`;
}

const needLogin = t => `<h2 class="text-warning">${t}</h2><p class="text-secondary">Entre na sua conta para ver esta página.</p><button class="btn btn-warning fw-bold" data-act="login">Entrar</button>`;

function muralHTML() {
  const m = S.mural;
  if (!m || (!m.product_id && !m.client_user_id && !m.note)) return '';
  return `<h2 class="gt mt-0">Mural da semana</h2><div class="row g-3 mb-4">
    ${m.product_id ? `<div class="col-md-4"><div class="card bg-cabana text-light h-100"><div class="card-body"><span class="text-secondary small">Produto do mês</span><h5 class="mt-1">${m.pe || '🍁'} ${esc(m.pname || '')}</h5><button class="btn btn-sm btn-warning" data-go="p/${m.product_id}">Ver produto</button></div></div></div>` : ''}
    ${m.client_user_id ? `<div class="col-md-4"><div class="card bg-cabana text-light h-100"><div class="card-body"><span class="text-secondary small">Cliente do mês</span><h5 class="mt-1">👤 ${esc(m.cname || '')}</h5></div></div></div>` : ''}
    ${m.note ? `<div class="col-md-4"><div class="card bg-cabana text-light h-100"><div class="card-body"><span class="text-secondary small">Recado da cabana</span><p class="mb-0 mt-1">${esc(m.note)}</p></div></div></div>` : ''}
  </div>`;
}

function reviewForm(p) {
  return `<h3 class="gt">Deixe sua avaliação</h3><form id="rf" data-pid="${p.id}" class="row g-2 align-items-end mb-3">
    <div class="col-auto"><label for="rv" class="form-label">Nota</label><select id="rv" class="form-select">${[5,4,3,2,1].map(n => `<option value="${n}">${'★'.repeat(n)} (${n})</option>`).join('')}</select></div>
    <div class="col-12"><label for="rt" class="form-label">Comentário</label><textarea id="rt" class="form-control" rows="2" maxlength="500"></textarea></div>
    <div class="col-auto"><button class="btn btn-warning btn-sm mt-2" type="submit">Enviar avaliação</button></div>
  </form>`;
}

function productView(id) {
  const p = find(id);
  if (!p) return `<p>Produto não encontrado.</p><button class="btn btn-warning" data-go="inicio">Voltar</button>`;
  const f = favs().includes(p.id), a = avg(p), low = p.ok && p.stock <= 0;
  const gal = p.images.length
    ? `<div class="row row-cols-3 row-cols-sm-4 g-2 mb-3">${p.images.map(im => `<div class="col position-relative"><div class="ratio ratio-1x1"><img src="uploads/${esc(im.filename)}" class="w-100 h-100 object-fit-cover rounded" alt=""></div>${(me && me.r === 'admin') ? `<button class="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0" style="transform:translate(35%,-35%)" data-delimg="${im.id}" aria-label="Remover imagem">×</button>` : ''}</div>`).join('')}</div>`
    : `<div class="ratio ratio-1x1 bg-secondary-subtle rounded mb-3 d-flex align-items-center justify-content-center"><span style="font-size:4.5rem">${p.e}</span></div>`;
  const revs = p.reviews.length
    ? p.reviews.map(r => `<div class="card bg-cabana text-light mb-2"><div class="card-body py-2"><div class="d-flex justify-content-between"><b>${esc(r.uname)}</b><span class="text-warning">${'★'.repeat(r.rating)}</span></div>${r.text ? `<p class="mb-0 mt-1 small">${esc(r.text)}</p>` : ''}</div></div>`).join('')
    : `<p class="text-secondary">Ainda não há avaliações. Seja o primeiro!</p>`;
  const admBox = (me && me.r === 'admin') ? `<div class="card bg-cabana text-light mt-4"><div class="card-body">
    <h3 class="gt mt-0">Administração do produto</h3>
    <form id="editF" data-pid="${p.id}">
      <div class="mb-2"><label for="enome" class="form-label">Nome</label><input id="enome" class="form-control" value="${esc(p.name)}" required></div>
      <div class="mb-2"><label for="edesc" class="form-label">Descrição</label><textarea id="edesc" class="form-control" rows="3">${esc(p.d)}</textarea></div>
      <div class="mb-2"><label for="eprice" class="form-label">Preço (R$)</label><input id="eprice" type="number" step="0.01" min="0" class="form-control" value="${p.price}"></div>
      <button class="btn btn-warning btn-sm" type="submit">Salvar alterações</button>
    </form>
    <div class="mb-2 mt-3"><label for="raSel" class="form-label">Classificação indicativa</label><select id="raSel" class="form-select" data-setra="${p.id}">${Object.keys(AGE).map(k => `<option value="${k === 'L' ? 'L' : k.slice(1)}" ${((p.rating_age || 'L') === (k === 'L' ? 'L' : k.slice(1))) ? 'selected' : ''}>${AGE[k]}</option>`).join('')}</select></div>
    <div class="mb-2"><label for="stkIn" class="form-label">Estoque atual</label><div class="d-flex gap-2"><input id="stkIn" type="number" min="0" value="${p.stock}" class="form-control" style="max-width:120px"><button class="btn btn-warning btn-sm" data-setstock="${p.id}">Salvar estoque</button></div></div>
    <div class="mb-2"><label for="imgIn" class="form-label">Adicionar imagem</label><input id="imgIn" type="file" accept="image/*" class="form-control mb-2"><button class="btn btn-outline-warning btn-sm" data-upimg="${p.id}">Enviar imagem</button></div>
    <button class="btn btn-outline-danger btn-sm mt-3" data-del="${p.id}">Remover produto</button>
  </div></div>` : '';
  return `<button class="btn btn-outline-warning btn-sm mb-3" data-go="${p.c}">← Voltar</button>
  <div class="row g-4">
    <div class="col-md-5">${gal}</div>
    <div class="col-md-7">
      <h2 class="text-warning">${esc(p.name)}</h2>
      <div class="mb-2">${badge(p.rating_age)} ${a ? `<span class="text-warning small">★ ${a.toFixed(1)} (${p.reviews.length} avaliações)</span>` : ''}</div>
      <p class="text-secondary">${esc(p.d)}</p>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <b class="fs-4">${brl(p.price)}</b><span class="text-secondary small">${p.stock > 0 ? p.stock + ' em estoque' : 'sem estoque'}</span>
      </div>
      <div class="d-flex gap-2">
        <button class="btn ${f ? 'btn-danger' : 'btn-outline-secondary'}" data-fav="${p.id}">♥ Favoritar</button>
        <button class="btn btn-warning fw-bold" data-add="${p.id}" ${p.ok && !low ? '' : 'disabled'}>${low || !p.ok ? 'Indisponível' : 'Adicionar ao carrinho'}</button>
      </div>
    </div>
  </div>
  <h3 class="gt">Avaliações</h3>${revs}${me ? reviewForm(p) : '<p class="text-secondary">Entre na sua conta para avaliar este produto.</p>'}
  ${admBox}`;
}

// Cartão de uma máquina do fliperama: favoritar define o "mais procurado"; o botão
// "Jogar" deixa o cliente escolher o jogo na hora de gastar 1 ficha universal.
function machineCard(m) {
  const heart = me
    ? `<button class="btn btn-sm ${m.myFav ? 'btn-danger' : 'btn-outline-secondary'} rounded-circle" data-arcfav="${m.id}" aria-pressed="${m.myFav}" aria-label="Favoritar ${esc(m.name)}">♥ ${m.favs}</button>`
    : `<span class="text-secondary small">♥ ${m.favs}</span>`;
  const playBtn = me ? `<button class="btn btn-sm btn-warning fw-bold" data-arcuse="${m.id}" ${me.tickets > 0 ? '' : 'disabled'}>Jogar (1 ficha)</button>` : '';
  const delBtn = (me && me.r === 'admin') ? `<button class="btn btn-sm btn-outline-danger" data-arcdel="${m.id}" aria-label="Remover máquina">🗑</button>` : '';
  return `<div class="col">
    <div class="card bg-cabana text-light h-100 position-relative">
      ${m.top ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2">🏆 Mais procurado</span>` : ''}
      ${m.game ? `<span class="badge bg-info text-dark position-absolute top-0 start-0 m-2">Jogável</span>` : ''}
      <div class="card-body d-flex flex-column">
        <h3 class="h5">${m.e} ${esc(m.name)}</h3>
        <p class="text-secondary small flex-grow-1">${esc(m.d)}</p>
        <div class="d-flex justify-content-between align-items-center">
          ${heart}
          <div class="d-flex gap-1">${playBtn}${delBtn}</div>
        </div>
      </div>
    </div>
  </div>`;
}

const V = {
inicio() {
  const m = find('milk') || {price: 24};
  return muralHTML() + `
  <div class="row g-4 mb-4 align-items-stretch">
    <div class="col-lg-6">
      <div class="bg-plank rounded-3 p-4 h-100 border border-dark border-3">
        <h1>Cabana do Geraldo</h1>
        <p>Fliperama, cafeteria e sabores do norte. Aqui o xarope de bordo escorre em tudo que merece.</p>
        <div class="d-flex gap-2 flex-wrap mt-3">
          <button class="btn btn-warning fw-bold" data-go="cafe">Ver o cardápio</button>
          <button class="btn btn-outline-warning" data-go="fliperama">Ir ao fliperama</button>
        </div>
      </div>
    </div>
    <div class="col-lg-6">
      <div class="card bg-cabana text-light h-100"><div class="card-body d-flex gap-3 align-items-center">
        <svg viewBox="0 0 120 190" width="110" aria-hidden="true"><rect x="78" y="2" width="8" height="70" rx="3" fill="#b8381f" transform="rotate(12 82 37)"/><circle cx="38" cy="52" r="20" fill="#f7ead2"/><circle cx="62" cy="48" r="22" fill="#f7ead2"/><circle cx="84" cy="54" r="18" fill="#f7ead2"/><path d="M18 62h84l-12 112q-2 12-14 12H44q-12 0-14-12z" fill="#f0c98a" stroke="#e39a22" stroke-width="3"/><path d="M22 84q14 18 18 -2t16 10 14-6 14 8 14-8" fill="none" stroke="#c9731a" stroke-width="6"/><path d="M34 62v28q0 8 6 0v-28zM74 62v36q0 9 7 0v-36z" fill="#c9731a"/></svg>
        <div><h2>Milkshake Vale do Orvalho</h2><p class="text-secondary">Baunilha gelada, xarope de bordo e chantilly. O pedido mais feito da cabana.</p><button class="btn btn-warning fw-bold" data-add="milk">Pedir por ${brl(m.price)}</button></div>
      </div></div>
    </div>
  </div>
  <h2 class="text-warning">Explore a cabana</h2>
  <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
    <div class="col"><button class="btn btn-outline-warning text-start p-3 h-100 w-100" data-go="cafe"><b class="d-block">Cafeteria</b><span class="text-secondary small">Poutine, panquecas, tourtière e xarope canadense.</span></button></div>
    <div class="col"><button class="btn btn-outline-warning text-start p-3 h-100 w-100" data-go="fliperama"><b class="d-block">Fliperama</b><span class="text-secondary small">Várias máquinas para escolher e jogar na cabana.</span></button></div>
    <div class="col"><button class="btn btn-outline-warning text-start p-3 h-100 w-100" data-go="lembranca"><b class="d-block">Lembrancinhas</b><span class="text-secondary small">Xarope, canecas, mantas e fichas.</span></button></div>
    <div class="col"><button class="btn btn-outline-warning text-start p-3 h-100 w-100" data-go="tcg"><b class="d-block">Loja de cartas</b><span class="text-secondary small">Pokémon e Yu-Gi-Oh! para colecionar e duelar.</span></button></div>
  </div>`;
},
sobre() {
  const linhas = [
    'Somos uma cabana de outono no coração do Vale do Orvalho.',
    'Nasceu de uma receita de panquecas e de um fliperama na garagem.',
    'Hoje servimos café, poutine e doces com xarope de bordo de verdade.',
    'Cada prato é feito na hora, com carinho e um toque de canela.',
    'No fliperama, as fichas são universais e a diversão não fecha.',
    'Também guardamos lembrancinhas e cartas para levar para casa.',
    'Nosso time é pequeno, mas sabe fazer o cliente voltar.',
    'Passa aqui, senta na mesa 4 e deixa o outono acontecer.'
  ];
  return `<h2 class="text-warning">Sobre nós</h2>
  <div class="card bg-cabana text-light border border-warning"><div class="card-body">
    ${linhas.map(l => `<p class="mb-1">${esc(l)}</p>`).join('')}
    <hr class="border-secondary-subtle">
    <div class="d-flex flex-wrap gap-3 gap-md-4">
      <span>📸 Instagram: <a href="https://www.instagram.com/cabanadogeraldo/" target="_blank" rel="noopener">@cabanadogeraldo</a></span>
      <span>✉️ E-mail: <a href="mailto:contato@cabanadogeraldo.com.br">contato@cabanadogeraldo.com.br</a></span>
      <span>👍 Facebook: <a href="https://www.facebook.com/cabanadogeraldo/" target="_blank" rel="noopener">facebook.com/cabanadogeraldo</a></span>
    </div>
  </div></div>`;
},
cafe: () => list('cafe', 'Cafeteria', 'Comida canadense e do norte, feita na hora. O xarope de bordo é o ingrediente principal da casa.'),
lembranca: () => list('lembranca', 'Lembrancinhas', 'Leve um pedaço da cabana para casa.'),
tcg: () => list('tcg', 'Loja de cartas', 'Boosters, decks e acessórios de Pokémon e Yu-Gi-Oh!.'),
fliperama() {
  const f = find('fichas');
  const machines = S.arcade.map(machineCard).join('');
  const admArc = (me && me.r === 'admin') ? `<div class="card bg-cabana text-light mt-4"><div class="card-body">
    <h3 class="gt mt-0">Adicionar máquina</h3>
    <form id="arcF" class="row g-2">
      <div class="col-auto"><label for="ame" class="form-label">Ícone</label><input id="ame" class="form-control" maxlength="4" value="🕹️" style="max-width:80px"></div>
      <div class="col-md-5"><label for="anm" class="form-label">Nome da máquina</label><input id="anm" class="form-control" required></div>
      <div class="col-12"><label for="adsc" class="form-label">Descrição</label><textarea id="adsc" class="form-control" rows="2"></textarea></div>
      <div class="col-12"><label for="agm" class="form-label">Jogo</label><select id="agm" class="form-select"><option value="">Nenhum (máquina decorativa)</option><option value="hordas">Horda (estilo Vampire Survivors)</option><option value="doom">Doom clássico</option><option value="mario">Plataformer (estilo Mario)</option></select></div>
      <div class="col-12"><button class="btn btn-warning btn-sm mt-2" type="submit">Adicionar máquina</button></div>
    </form>
  </div></div>` : '';
  return `<div class="row g-4 align-items-center mb-4">
    <div class="col-lg-5"><div class="cab mx-auto" role="img" aria-label="Gabinete de fliperama da cabana">
      <div class="mq">FLIPERAMA</div><div class="scr"><span>INSERT COIN</span></div>
      <div class="ctl"><i class="joystick"></i><i class="arcbtn"></i><i class="arcbtn b2"></i></div>
    </div></div>
    <div class="col-lg-7">
      <h2>Fliperama</h2>
      <p>Fichas universais: servem para qualquer máquina da casa. Escolha o jogo na hora de usar.</p>
      ${me ? `<p class="text-warning fw-bold">Você tem ${me.tickets} ficha${me.tickets === 1 ? '' : 's'}.</p>` : `<p class="text-secondary small">Entre na sua conta para ver suas fichas e jogar.</p>`}
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-warning fw-bold" data-add="fichas">Comprar fichas (${brl(f ? f.price : 20)})</button>
        <button class="btn btn-outline-warning" data-go="cafe">Ver o cardápio</button>
      </div>
    </div>
  </div>
  <h3 class="gt mt-0">Máquinas da casa</h3>
  ${S.arcade.length ? `<div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">${machines}</div>` : '<p class="text-secondary">Nenhuma máquina cadastrada ainda.</p>'}
  ${admArc}`;
},
favoritos() {
  if (!me) return needLogin('Favoritos');
  const ps = favs().map(find).filter(Boolean);
  return `<h2 class="text-warning">Favoritos</h2>` + (ps.length
    ? `<div class="row produtos-grade g-3">${ps.map(card).join('')}</div>`
    : `<p class="text-secondary">Toque no ♥ de qualquer item da loja para guardá-lo aqui.</p>`);
},
pedidos() {
  if (!me) return needLogin('Meus pedidos');
  const os = S.orders.filter(o => o.user === me.n);
  return `<h2 class="text-warning">Meus pedidos</h2>` + (os.length ? os.map(o => orderHTML(o)).join('') : `<p class="text-secondary">Você ainda não fez nenhum pedido. Abra o cardápio para começar.</p>`);
},
perfil() {
  if (!me) return needLogin('Perfil');
  const av = me.avatar
    ? `<img src="uploads/${esc(me.avatar)}" class="rounded-circle object-fit-cover" style="width:90px;height:90px" alt="">`
    : `<div class="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center" style="width:90px;height:90px;font-size:2.4rem">🧑‍🌾</div>`;
  return `<h2 class="text-warning">Meu perfil</h2>
  <div class="row g-4">
    <div class="col-auto text-center">
      ${av}
      <label for="avIn" class="form-label small text-secondary d-block mt-2">Trocar foto</label>
      <input id="avIn" type="file" accept="image/*" class="form-control form-control-sm mb-2">
      <button class="btn btn-outline-warning btn-sm" data-act="upav">Enviar foto</button>
    </div>
    <div class="col" style="min-width:240px">
      <form id="pf2">
        <div class="mb-2"><label for="dn" class="form-label">Nome de exibição</label><input id="dn" class="form-control" value="${esc(me.dn || me.n)}"></div>
        <div class="mb-2"><label for="bio" class="form-label">Bio</label><textarea id="bio" class="form-control" rows="3" maxlength="400">${esc(me.bio || '')}</textarea></div>
        <div class="mb-2"><label for="np" class="form-label">Nova senha (opcional)</label><input id="np" type="password" class="form-control" autocomplete="new-password"></div>
        <p class="text-warning">Você tem ${me.tickets} ficha${me.tickets === 1 ? '' : 's'} de fliperama.</p>
        <button class="btn btn-warning fw-bold" type="submit">Salvar perfil</button>
      </form>
    </div>
  </div>`;
},
painel() {
  if (!me) return needLogin('Painel admin');
  if (me.r !== 'admin') return `<h2 class="text-warning">Painel admin</h2><p class="text-secondary">Esta área é só para o administrador.</p>`;
  const mSel = `<select id="muralP" class="form-select"><option value="">— nenhum —</option>${S.products.map(p => `<option value="${p.id}" ${S.mural && S.mural.product_id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`;
  const cSel = `<select id="muralC" class="form-select"><option value="">— nenhum —</option>${S.users.map(u => `<option value="${u.id}" ${S.mural && S.mural.client_user_id == u.id ? 'selected' : ''}>${esc(u.dn)}</option>`).join('')}</select>`;
  return `<h2 class="text-warning">Painel admin</h2>

  <h3 class="gt mt-0">Mural da semana</h3>
  <form id="muralF" class="row g-2 mb-4">
    <div class="col-md-4"><label class="form-label">Produto do mês</label>${mSel}</div>
    <div class="col-md-4"><label class="form-label">Cliente do mês</label>${cSel}</div>
    <div class="col-md-4"><label for="muralN" class="form-label">Recado</label><input id="muralN" class="form-control" value="${esc(S.mural && S.mural.note || '')}"></div>
    <div class="col-12"><button class="btn btn-warning btn-sm" type="submit">Salvar mural</button></div>
  </form>

  <h3 class="gt">Música da cabana</h3>
  <p class="text-secondary small">Música atual: ${S.music ? esc(S.music) : 'nenhuma enviada'}.</p>
  <div class="d-flex gap-2 mb-4 flex-wrap"><input id="musIn" type="file" accept="audio/*" class="form-control" style="max-width:320px"><button class="btn btn-outline-warning" data-act="upmusic">Enviar música</button></div>

  <h3 class="gt">Registro de vendas</h3>
  <div class="table-responsive mb-4"><table class="table table-dark table-striped align-middle">
    <thead><tr><th>Produto</th><th>Qtd. vendida</th><th>Receita</th></tr></thead>
    <tbody>${S.sales.length ? S.sales.map(s => `<tr><td>${esc(s.name)}</td><td>${s.qtd}</td><td>${brl(s.rev)}</td></tr>`).join('') : '<tr><td colspan="3" class="text-secondary">Sem vendas ainda.</td></tr>'}</tbody>
  </table></div>

  <h3 class="gt">Usuários</h3>
  <div class="table-responsive mb-4"><table class="table table-dark table-striped align-middle">
    <thead><tr><th>Nome</th><th>Cargo</th><th>Ação</th></tr></thead>
    <tbody>${S.users.map(u => { const self = u.id === me.id, demote = u.role === 'admin'; return `<tr><td>${esc(u.dn)}</td><td>${u.role}</td><td><button class="btn btn-sm btn-outline-warning" data-promote="${u.id}:${demote ? 'user' : 'admin'}" ${self && demote ? 'disabled title="Você não pode tirar o seu próprio cargo de admin."' : ''}>${demote ? 'Tornar padrão' : 'Tornar admin'}</button></td></tr>`; }).join('')}</tbody>
  </table></div>

  <h3 class="gt">Pedidos recebidos</h3>
  ${S.orders.length ? S.orders.map(o => orderHTML(o, 1)).join('') : '<p class="text-secondary">Nenhum pedido ainda.</p>'}

  <h3 class="gt">Produtos</h3>
  <div class="table-responsive mb-4"><table class="table table-dark table-striped align-middle">
    <thead><tr><th>Item</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead>
    <tbody>${S.products.map(p => `<tr><td>${p.e} ${esc(p.name)}</td><td>${p.c}</td><td>${brl(p.price)}</td><td>${p.stock}</td><td class="d-flex gap-1 flex-wrap"><button class="btn btn-sm btn-outline-warning" data-go="p/${p.id}">Gerenciar</button><button class="btn btn-sm btn-outline-secondary" data-tog="${p.id}">${p.ok ? 'Esgotar' : 'Repor'}</button></td></tr>`).join('')}</tbody>
  </table></div>

  <h3 class="gt">Novo produto</h3>
  <form id="pf" class="row g-2" style="max-width:520px">
    <div class="col-12"><label for="pn" class="form-label">Nome</label><input id="pn" class="form-control" required></div>
    <div class="col-12"><label for="pd" class="form-label">Descrição</label><input id="pd" class="form-control"></div>
    <div class="col-6"><label for="pp" class="form-label">Preço (R$)</label><input id="pp" type="number" step="0.01" min="0" class="form-control" required></div>
    <div class="col-6"><label for="pst" class="form-label">Estoque inicial</label><input id="pst" type="number" min="0" value="20" class="form-control"></div>
    <div class="col-6"><label for="pra" class="form-label">Classificação indicativa</label><select id="pra" class="form-select">${Object.keys(AGE).map(k => `<option value="${k === 'L' ? 'L' : k.slice(1)}">${AGE[k]}</option>`).join('')}</select></div>
    <div class="col-6"><label for="pc" class="form-label">Categoria</label><select id="pc" class="form-select"><option value="cafe">Cafeteria</option><option value="lembranca">Lembrancinhas</option><option value="tcg">Loja de cartas</option></select></div>
    <div class="col-12"><button class="btn btn-warning fw-bold mt-2" type="submit">Adicionar produto</button></div>
  </form>`;
}
};
