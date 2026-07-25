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

  document.querySelectorAll('.tabbar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.secao === secaoId);
  });

  // Cada tela dispara seu próprio "render" ao ser exibida
  const renderFn = window['render_' + secaoId];
  if (typeof renderFn === 'function') renderFn();
}
