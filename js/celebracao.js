// ============================================================
// BORA — Celebração (confete + frase rotativa)
// Usado ao fazer check-in e ao clicar num dia marcado no calendário.
// ============================================================

const FRASES_CELEBRACAO = [
  'Parabéns! Hoje você venceu a procrastinação!',
  'Você venceu o cansaço hoje!',
  'Você venceu o desânimo!',
  'Mandou bem! Você venceu a preguiça hoje!',
  'Isso! Mais um dia vencido!',
  'Show! Você venceu a vontade de ficar parado!',
  'Aeee! Você venceu mais essa!',
];

function celebracao_frase() {
  return FRASES_CELEBRACAO[Math.floor(Math.random() * FRASES_CELEBRACAO.length)];
}

function celebracao_disparar() {
  document.getElementById('celebracao-checkin-titulo').textContent = celebracao_frase();
  celebracao_gerarConfete('confete-container-checkin');
  document.getElementById('modal-celebracao-checkin').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('modal-celebracao-checkin').style.display = 'none';
  }, 2000);
}

function celebracao_gerarConfete(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cores = ['#FF5A3C', '#FFC93C', '#E63977', '#2FA84F', '#0E4F4A'];
  container.innerHTML = '';
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('div');
    el.className = 'confete-item';
    el.style.left = Math.random() * 100 + '%';
    el.style.background = cores[i % cores.length];
    el.style.animationDelay = (Math.random() * 0.4) + 's';
    container.appendChild(el);
  }
}
