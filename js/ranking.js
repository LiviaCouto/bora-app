// ============================================================
// BORA — Ranking da família (resumo público)
// Mostra só consistência (check-ins, streak, nível) — nunca carga/peso.
// ============================================================

async function render_ranking() {
  const supabase = getSupabase();
  const { data: perfis } = await supabase.from('perfis').select('id, nome, avatar_id').order('nome');

  const linhas = await Promise.all((perfis || []).map(async p => {
    const { data: checkins } = await supabase
      .from('checkins')
      .select('data')
      .eq('perfil_id', p.id)
      .order('data', { ascending: false })
      .limit(400);

    const total = (checkins || []).length;
    const streak = calcularStreak(checkins || []);
    const nivel = calcularNivel(total);

    return { ...p, total, streak, nivel };
  }));

  linhas.sort((a, b) => b.streak - a.streak);

  document.getElementById('ranking-lista').innerHTML = linhas.map(p => `
    <div class="admin-item-linha">
      <div style="display:flex;align-items:center;gap:10px">
        ${avatares_img(p.avatar_id, 36)}
        <div>
          <strong>${p.nome}</strong>
          <div class="muted">${p.total} check-ins no total · Nível ${p.nivel.nome}</div>
        </div>
      </div>
      <span class="badge badge-chama">🔥 ${p.streak}</span>
    </div>
  `).join('') || '<p class="muted">Nenhum perfil ainda.</p>';
}
