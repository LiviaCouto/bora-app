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
};

function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}
