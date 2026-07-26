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
  primeiro_checkin: { titulo: 'Primeiro Passo', descricao: 'Fez o primeiro check-in', icone: 'flame' },
  primeira_semana: { titulo: 'Primeira Semana', descricao: '7 check-ins seguidos', icone: 'flag' },
  mes_completo: { titulo: 'Mês Completo', descricao: 'Um ciclo de treino concluído', icone: 'check-circle' },
  recorde_pessoal: { titulo: 'Recorde Pessoal', descricao: 'Bateu uma carga ou tempo novo', icone: 'trending-up' },
  sextou_fitness: { titulo: 'Sextou Fitness', descricao: '4 sextas-feiras seguidas treinando', icone: 'star' },
  time_completo: { titulo: 'Time Completo', descricao: 'Todos os perfis com check-in no mesmo dia', icone: 'users' },
  streak_30: { titulo: 'Chama Firme', descricao: '30 dias seguidos de check-in', icone: 'flame' },
  streak_100: { titulo: 'Lenda do Bora', descricao: '100 dias seguidos de check-in', icone: 'award' },
  madrugador: { titulo: 'Madrugador', descricao: 'Fez check-in antes das 7h', icone: 'sun' },
  coruja: { titulo: 'Coruja', descricao: 'Fez check-in depois das 22h', icone: 'moon' },
  fim_de_semana_guerreiro: { titulo: 'Guerreiro de Fim de Semana', descricao: 'Treinou sábado e domingo na mesma semana', icone: 'calendar-check' },
  explorador: { titulo: 'Explorador', descricao: 'Experimentou 3 modalidades diferentes', icone: 'sparkles' },
  cem_checkins: { titulo: 'Cem Check-ins', descricao: '100 check-ins no total', icone: 'trophy' },
  foto_enviada: { titulo: 'Registrou na Régua', descricao: 'Enviou uma foto do treino em papel', icone: 'image' },
  perfil_completo: { titulo: 'Perfil Completo', descricao: 'Preencheu idade e objetivo no perfil', icone: 'check-circle' },
};

async function gamificacao_verificarBadges(perfilId) {
  const supabase = getSupabase();

  const { data: checkins } = await supabase
    .from('checkins')
    .select('data, criado_em, tipo_atividade_id')
    .eq('perfil_id', perfilId)
    .order('data', { ascending: false })
    .limit(400);

  const lista = checkins || [];
  const total = lista.length;

  if (total >= 1) await gamificacao_concederBadge(perfilId, 'primeiro_checkin');
  if (total >= 100) await gamificacao_concederBadge(perfilId, 'cem_checkins');

  const streak = calcularStreak(lista);
  if (streak >= 7) await gamificacao_concederBadge(perfilId, 'primeira_semana');
  if (streak >= 30) await gamificacao_concederBadge(perfilId, 'streak_30');
  if (streak >= 100) await gamificacao_concederBadge(perfilId, 'streak_100');

  // Madrugador / Coruja (baseado no horário de criação do check-in)
  const temMadrugada = lista.some(c => c.criado_em && new Date(c.criado_em).getHours() < 7);
  if (temMadrugada) await gamificacao_concederBadge(perfilId, 'madrugador');
  const temCoruja = lista.some(c => c.criado_em && new Date(c.criado_em).getHours() >= 22);
  if (temCoruja) await gamificacao_concederBadge(perfilId, 'coruja');

  // Explorador — 3+ modalidades diferentes
  const modalidadesDistintas = new Set(lista.map(c => c.tipo_atividade_id).filter(Boolean));
  if (modalidadesDistintas.size >= 3) await gamificacao_concederBadge(perfilId, 'explorador');

  // Guerreiro de fim de semana — sábado (6) e domingo (0) na mesma semana
  const datasPorSemana = {};
  lista.forEach(c => {
    const d = new Date(c.data + 'T00:00:00');
    const diaSemana = d.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      const inicioSemana = new Date(d);
      inicioSemana.setDate(d.getDate() - diaSemana);
      const chave = inicioSemana.toISOString().split('T')[0];
      if (!datasPorSemana[chave]) datasPorSemana[chave] = new Set();
      datasPorSemana[chave].add(diaSemana);
    }
  });
  const teveFimDeSemanaCompleto = Object.values(datasPorSemana).some(s => s.has(0) && s.has(6));
  if (teveFimDeSemanaCompleto) await gamificacao_concederBadge(perfilId, 'fim_de_semana_guerreiro');

  // Foto enviada
  const { count: totalFotos } = await supabase
    .from('fotos_treino')
    .select('id', { count: 'exact', head: true })
    .eq('perfil_id', perfilId);
  if (totalFotos > 0) await gamificacao_concederBadge(perfilId, 'foto_enviada');

  // Perfil completo
  const { data: perfilAtual } = await supabase
    .from('perfis')
    .select('idade, objetivo')
    .eq('id', perfilId)
    .maybeSingle();
  if (perfilAtual && perfilAtual.idade && perfilAtual.objetivo) {
    await gamificacao_concederBadge(perfilId, 'perfil_completo');
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
