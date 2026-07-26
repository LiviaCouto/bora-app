// ============================================================
// BORA — Estado global e roteador
// Regra de ouro: cada módulo só mexe na sua própria seção do DOM.
// Nunca sobrescrever uma função com o mesmo nome de outro arquivo —
// sempre criar uma função nova que chama a original, se precisar estender.
// ============================================================

const AppState = {
  perfilAtual: null, // { id, nome, avatar_id, papel, ... }
  cicloAtivoCache: null,
  treinoEscolhidoHoje: null, // 'A' | 'B'
};

function salvarSessao(perfil) {
  const expiraEm = Date.now() + CONFIG.SESSAO_HORAS * 60 * 60 * 1000;
  localStorage.setItem('bora_sessao', JSON.stringify({ perfil, expiraEm }));
  AppState.perfilAtual = perfil;
  atualizarTabsPorPapel();
}

function atualizarTabsPorPapel() {
  const perfil = AppState.perfilAtual;
  const botaoAdmin = document.querySelector('.tabbar-item[data-secao="admin"]');
  if (botaoAdmin) {
    botaoAdmin.style.display = (perfil && perfil.papel === 'admin') ? 'flex' : 'none';
  }
}

function carregarSessao() {
  const raw = localStorage.getItem('bora_sessao');
  if (!raw) return null;
  try {
    const { perfil, expiraEm } = JSON.parse(raw);
    if (Date.now() > expiraEm) {
      localStorage.removeItem('bora_sessao');
      return null;
    }
    AppState.perfilAtual = perfil;
    return perfil;
  } catch {
    return null;
  }
}

function encerrarSessao() {
  localStorage.removeItem('bora_sessao');
  sessionStorage.removeItem('bora_ultima_secao');
  AppState.perfilAtual = null;
  irPara('auth');
}

// Mostra a seção pedida (por id de elemento) e esconde as outras.
// Todas as seções top-level devem ter a classe "app-section".
function irPara(secaoId) {
  document.querySelectorAll('.app-section').forEach(el => {
    el.style.display = 'none';
  });
  const alvo = document.getElementById('secao-' + secaoId);
  if (alvo) alvo.style.display = 'block';

  // Guarda a tela atual só se a pessoa já estiver logada — assim um F5/refresh
  // continua na mesma tela, mas abrir o app do zero (aba nova) sempre volta
  // pra seleção de perfil.
  if (AppState.perfilAtual && secaoId !== 'auth' && secaoId !== 'onboarding' && secaoId !== 'conviteinvalido') {
    sessionStorage.setItem('bora_ultima_secao', secaoId);
  }

  const tabbar = document.querySelector('.tabbar');
  if (tabbar) {
    const escondeTabbar = (secaoId === 'auth' || secaoId === 'onboarding' || secaoId === 'conviteinvalido');
    tabbar.style.display = escondeTabbar ? 'none' : 'flex';
  }
  document.body.style.paddingBottom = (secaoId === 'auth' || secaoId === 'onboarding' || secaoId === 'conviteinvalido') ? '20px' : '';

  document.querySelectorAll('.tabbar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.secao === secaoId);
  });
  atualizarTabsPorPapel();

  // Cada tela dispara seu próprio "render" ao ser exibida
  const renderFn = window['render_' + secaoId];
  if (typeof renderFn === 'function') renderFn();
}
