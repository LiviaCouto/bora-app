// ============================================================
// BORA — Seleção de avatar (grade estilo Netflix/Disney+)
// Avatares são arquivos estáticos em icons/avatars/ — o banco só
// guarda o avatar_id (nome do arquivo, sem extensão).
// ============================================================

const AVATARES_DISPONIVEIS = [
  'coelha-halteres', 'raposa-halteres', 'onca-forte', 'leoa-agua',
  'lobo-determinado', 'touro-halteres', 'urso-shake', 'aguia-positiva',
];

let avatares_callbackSelecao = null;

function avatares_abrirSeletor(onSelecionar) {
  avatares_callbackSelecao = onSelecionar;
  const grid = document.getElementById('avatares-grid');
  grid.innerHTML = AVATARES_DISPONIVEIS.map(a => `
    <button class="avatar-opcao" onclick="avatares_escolher('${a}')">
      <img src="icons/avatars/${a}.png" alt="${a}">
    </button>
  `).join('');
  document.getElementById('modal-avatares').style.display = 'flex';
}

function avatares_escolher(avatarId) {
  document.getElementById('modal-avatares').style.display = 'none';
  if (avatares_callbackSelecao) avatares_callbackSelecao(avatarId);
}

function avatares_fecharSeletor() {
  document.getElementById('modal-avatares').style.display = 'none';
}

// Helper usado em qualquer tela que precise mostrar o avatar de um perfil
function avatares_img(avatarId, tamanho = 48) {
  const id = avatarId || 'coelha-halteres';
  return `<img src="icons/avatars/${id}.png" width="${tamanho}" height="${tamanho}" style="border-radius:50%" alt="avatar">`;
}
