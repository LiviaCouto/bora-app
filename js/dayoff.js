// ============================================================
// BORA — Day off (pausa o streak sem culpa) + Comparativo entre ciclos
// ============================================================

async function dayoff_marcarHoje() {
  const perfil = AppState.perfilAtual;
  const motivo = prompt('Motivo (opcional, ex: viagem, gripe, folga combinada):') || null;

  const supabase = getSupabase();
  const { error } = await supabase.from('dias_pausa').insert({
    perfil_id: perfil.id,
    data: todayLocal(),
    motivo,
  });

  if (error) {
    alert('Não foi possível marcar o day off (talvez já tenha marcado hoje).');
    return;
  }

  alert('Day off registrado. Sua sequência não vai quebrar por hoje 🌴');
  render_home();
}

// Streak "consciente de day off": dias marcados como pausa não contam
// como quebra, mas também não somam ao contador.
async function calcularStreakComDayOff(perfilId) {
  const supabase = getSupabase();
  const { data: checkins } = await supabase
    .from('checkins').select('data').eq('perfil_id', perfilId)
    .order('data', { ascending: false }).limit(400);
  const { data: pausas } = await supabase
    .from('dias_pausa').select('data').eq('perfil_id', perfilId)
    .order('data', { ascending: false }).limit(400);

  const datasCheckin = new Set((checkins || []).map(c => c.data));
  const datasPausa = new Set((pausas || []).map(p => p.data));

  let streak = 0;
  let cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
    if (datasCheckin.has(iso)) {
      streak++;
    } else if (datasPausa.has(iso)) {
      // dia de pausa: não soma, mas também não quebra — só pula
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ---------- Comparativo entre ciclos ----------

async function render_comparativo() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data: ciclos } = await supabase
    .from('ciclos')
    .select('*')
    .eq('perfil_id', perfil.id)
    .order('data_inicio', { ascending: false });

  if (!ciclos || ciclos.length < 2) {
    document.getElementById('comparativo-conteudo').innerHTML =
      '<p class="muted">Precisa de pelo menos 2 ciclos concluídos pra comparar.</p>';
    return;
  }

  const linhas = await Promise.all(ciclos.slice(0, 2).map(async ciclo => {
    const { count } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('ciclo_id', ciclo.id);
    return { ciclo, checkins: count || 0 };
  }));

  document.getElementById('comparativo-conteudo').innerHTML = `
    <div class="grid-comparativo" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${linhas.map(l => `
        <div class="card">
          <div class="muted">Ciclo desde ${formatarDataBR(l.ciclo.data_inicio)}</div>
          <div style="font-family:var(--font-mono);font-size:22px;font-weight:600;margin-top:6px">${l.checkins}</div>
          <div class="muted" style="font-size:11px">check-ins nesse ciclo</div>
        </div>
      `).join('')}
    </div>
  `;
}
