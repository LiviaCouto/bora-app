// ============================================================
// BORA — Frases motivacionais (exibidas na Home antes do check-in)
// ============================================================

const FRASES_MOTIVACIONAIS = [
  'Bora manter o pique hoje?',
  'Cada dia conta. Bora nessa!',
  'Seu eu de amanhã agradece o de hoje.',
  'Consistência vence intensidade.',
  'Um treino de cada vez.',
  'Hoje é um bom dia pra continuar.',
  'Sua família torce por você. Bora!',
  'Pequenos passos, grandes resultados.',
];

function frase_do_dia() {
  const hoje = todayLocal();
  let soma = 0;
  for (let i = 0; i < hoje.length; i++) soma += hoje.charCodeAt(i);
  return FRASES_MOTIVACIONAIS[soma % FRASES_MOTIVACIONAIS.length];
}
