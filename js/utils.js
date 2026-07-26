// ============================================================
// BORA — Utilitários compartilhados
// ============================================================

// Data de hoje no fuso local, formato YYYY-MM-DD (nunca usar toISOString(),
// que converte pra UTC e pode voltar um dia em alguns fusos)
function todayLocal() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Hash simples de PIN via SubtleCrypto (SHA-256). Não é bcrypt, mas é
// suficiente pro contexto (uso familiar, sem dados sensíveis de terceiros).
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '::bora-salt-fixo');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Diferença em dias entre duas datas YYYY-MM-DD
function diferencaDias(dataA, dataB) {
  const a = new Date(dataA + 'T00:00:00');
  const b = new Date(dataB + 'T00:00:00');
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

// Mapa de ícones Lucide usados no app (path data simplificado, estilo do DS)
const ICONS = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  dumbbell: '<path d="M4 12h4M16 12h4M8 8v8M16 8v8M2 12h2M20 12h2"/>',
  'bar-chart': '<path d="M12 20V10M18 20V4M6 20v-6"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="18" cy="9" r="2.5"/><path d="M16 20c0-2.5 1.5-4.5 4-5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  'check-circle': '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
  flame: '<path d="M12 2C9 6 7 9 7 13a5 5 0 0 0 10 0c0-2-1-3.5-2-5 .2 2-1 3-2 2-.5-2 .5-5-1-8Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 6-2 8-2 8h16s-2-2-2-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  'message-square': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M5 6H3v2a4 4 0 0 0 4 4M19 6h2v2a4 4 0 0 1-4 4"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"/>',
  ruler: '<path d="M3 7h18v10H3z"/><path d="M7 7v3M11 7v5M15 7v3M19 7v5"/>',
  'trending-up': '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
  'file-text': '<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5M9 13h6M9 17h6M9 9h2"/>',
  lightbulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a6 6 0 0 0-4 10.5c.6.6 1 1.5 1 2.5h6c0-1 .4-1.9 1-2.5A6 6 0 0 0 12 2Z"/>',
  bug: '<rect x="8" y="8" width="8" height="10" rx="4"/><path d="M12 8V6M9 9 6 6M15 9l3-3M4 13H2M22 13h-2M4 19l3-2M20 19l-3-2"/>',
  heart: '<path d="M12 21s-7-4.5-9.5-9C0.5 8 2 4 6 4c2 0 4 1.5 6 4 2-2.5 4-4 6-4 4 0 5.5 4 3.5 8-2.5 4.5-9.5 9-9.5 9Z"/>',
  coffee: '<path d="M4 8h13a3 3 0 0 1 0 6h-1"/><path d="M4 8v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8"/><path d="M7 2v2M11 2v2"/>',
  'pause-circle': '<circle cx="12" cy="12" r="10"/><path d="M10 9v6M14 9v6"/>',
  flag: '<path d="M5 2v20"/><path d="M5 4h11l-2 4 2 4H5"/>',
  star: '<path d="M12 2l2.9 6.3 6.9.9-5 4.9 1.2 6.9L12 17.7 5.9 21l1.2-6.9-5-4.9 6.9-.9Z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/>',
  'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  gauge: '<path d="M12 14 15 9"/><circle cx="12" cy="14" r="1"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  footprints: '<path d="M4 16c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Z"/><path d="M20 8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3Z"/><path d="M6 16v3M18 8v-3"/>',
  waves: '<path d="M2 12c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0"/><path d="M2 18c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0"/>',
  'hand-fist': '<rect x="8" y="9" width="9" height="9" rx="3"/><path d="M8 13H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2M12 9V6a2 2 0 0 1 4 0v1"/>',
  'flower-2': '<circle cx="12" cy="12" r="2.5"/><path d="M12 2a3 3 0 0 1 0 6M12 22a3 3 0 0 1 0-6M2 12a3 3 0 0 1 6 0M22 12a3 3 0 0 1-6 0"/>',
  bike: '<circle cx="6" cy="17" r="3.5"/><circle cx="18" cy="17" r="3.5"/><path d="M6 17 10 8h5l3 9M10 8 8 5h-2M13 8l2.5 5.5"/>',
  sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M18.5 5.5 16 8M8 16l-2.5 2.5"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  'circulo-vazio': '<circle cx="12" cy="12" r="9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  video: '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 9.5 21 6.5v11L17 14.5"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.4 19.4 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a19.5 19.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>',
};

function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

// Toast visual simples (não é notificação do sistema, só um aviso na tela)
function mostrarToast(titulo, descricao) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast toast-success';
  el.innerHTML = `<div><div class="toast-title">${titulo}</div><div class="toast-desc">${descricao}</div></div>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

// Modal rápido de confirmação de salvamento (unificado pro app inteiro)
function mostrarModalSalvamento(mensagem) {
  const modal = document.getElementById('modal-salvamento');
  if (!modal) return;
  document.getElementById('modal-salvamento-texto').textContent = mensagem || 'Salvo com sucesso!';
  modal.style.display = 'flex';
  setTimeout(() => { modal.style.display = 'none'; }, 1400);
}
