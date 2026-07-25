// ============================================================
// BORA — Gamificação (níveis e badges)
// Regra: baseado em check-ins acumulados, nunca em carga/peso.
// ============================================================

const NIVEIS = [
  { min: 0, max: 9, nome: 'Faísca' },
  { min: 10, max: 29, nome: 'Chama Acesa' },
  { min: 30, max: 59, nome: 'Fogueira' },
  { min: 60, max: 99, nome: 'Brasa Forte' },
  { min: 100, max: Infinity, nome: 'Fera do Bora' },
];

function calcularNivel(totalCheckins) {
  return NIVEIS.find(n => totalCheckins >= n.min && totalCheckins <= n.max) || NIVEIS[0];
}

const BADGES = {
  primeira_semana: { titulo: 'Primeira Semana', descricao: '7 check-ins seguidos', emoji: '🏁' },
  mes_completo: { titulo: 'Mês Completo', descricao: 'Um ciclo de treino concluído', emoji: '📅' },
  recorde_pessoal: { titulo: 'Recorde Pessoal', descricao: 'Bateu uma carga ou tempo novo', emoji: '💪' },
  sextou_fitness: { titulo: 'Sextou Fitness', descricao: '4 sextas-feiras seguidas treinando', emoji: '🎉' },
  time_completo: { titulo: 'Time Completo', descricao: 'Todos os perfis com check-in no mesmo dia', emoji: '👨‍👩‍👧' },
};

async function gamificacao_verificarBadges(perfilId) {
  const supabase = getSupabase();

  // Primeira Semana: streak >= 7
  const { data: checkins } = await supabase
    .from('checkins')
    .select('data')
    .eq('perfil_id', perfilId)
    .order('data', { ascending: false })
    .limit(30);

  const streak = calcularStreak(checkins || []);
  if (streak >= 7) {
    await gamificacao_concederBadge(perfilId, 'primeira_semana');
  }
}

async function gamificacao_concederBadge(perfilId, codigo) {
  const supabase = getSupabase();
  const { data: jaTem } = await supabase
    .from('badges_conquistados')
    .select('id')
    .eq('perfil_id', perfilId)
    .eq('badge_codigo', codigo)
    .maybeSingle();

  if (jaTem) return; // já conquistou antes, não duplica

  await supabase.from('badges_conquistados').insert({
    perfil_id: perfilId,
    badge_codigo: codigo,
    data: todayLocal(),
  });
}
