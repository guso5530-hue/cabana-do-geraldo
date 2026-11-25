// Estado da aplicação (o que veio do servidor) e pequenos getters sobre ele.
const ST = ['Recebido', 'Preparando', 'Pronto', 'Entregue'];
const AGE = {L:'Livre', n10:'10 anos', n12:'12 anos', n14:'14 anos', n16:'16 anos', n18:'18 anos'};
let S = {products:[], orders:[], favs:[], mural:null, music:null, users:[], sales:[], arcade:[]};
let me = null;
let cart = {};

const VIEWS = ['inicio','cafe','fliperama','lembranca','tcg','favoritos','pedidos','perfil','painel','sobre'];
const LABEL = {inicio:'Início', cafe:'Cafeteria', fliperama:'Fliperama', lembranca:'Lembrancinhas', tcg:'Loja de cartas', favoritos:'Favoritos', pedidos:'Meus pedidos', perfil:'Perfil', painel:'Painel admin', sobre:'Sobre nós'};

const cur = () => location.hash.slice(1) || 'inicio';
const go = v => { if (location.hash === '#' + v) render(); else location.hash = v; window.scrollTo(0, 0); };
const find = id => S.products.find(p => p.id === id);
const favs = () => S.favs;
const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const avg = p => p.reviews && p.reviews.length ? (p.reviews.reduce((a, r) => a + Number(r.rating), 0) / p.reviews.length) : 0;

// Busca o estado completo no servidor (produtos, pedidos, fliperama, fichas...) e redesenha a página.
async function load() {
  const r = await api('state');
  if (r.err) { toast(r.err); render(); return; }
  me = r.me; S = r; render(); syncMusic();
}
