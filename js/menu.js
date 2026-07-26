// ============================================================
// BORA — Menu lateral (hambúrguer): Meu Perfil, tema, sair
// ============================================================

function menu_abrir() {
  document.getElementById('menu-lateral').classList.add('aberto');
  document.getElementById('menu-lateral-overlay').classList.add('aberto');
}

function menu_fechar() {
  document.getElementById('menu-lateral').classList.remove('aberto');
  document.getElementById('menu-lateral-overlay').classList.remove('aberto');
}

function menu_sair() {
  const confirmado = confirm('Sair e voltar pra seleção de perfil?');
  if (!confirmado) return;
  menu_fechar();
  encerrarSessao();
}

// ---------- Tema claro/escuro ----------

function tema_alternar() {
  const atual = document.documentElement.getAttribute('data-theme');
  if (atual === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('bora_tema', 'claro');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('bora_tema', 'dark');
  }
  tema_atualizarLabel();
}

function tema_atualizarLabel() {
  const label = document.getElementById('menu-tema-label');
  if (!label) return;
  const escuro = document.documentElement.getAttribute('data-theme') === 'dark';
  label.textContent = escuro ? 'Modo claro' : 'Modo escuro';
}

function tema_restaurarSalvo() {
  const salvo = localStorage.getItem('bora_tema');
  if (salvo === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  tema_atualizarLabel();
}
