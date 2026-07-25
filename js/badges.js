// ============================================================
// BORA — Conquistas (badges) do perfil
// ============================================================

async function render_badges() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data } = await supabase
    .from('badges_conquistados')
    .select('*')
    .eq('perfil_id', perfil.id)
    .order('data', { ascending: false });

  const conquistados = new Set((data || []).map(b => b.badge_codigo));

  document.getElementById('badges-lista').innerHTML = Object.entries(BADGES).map(([codigo, info]) => `
    <div class="admin-item-linha" style="opacity:${conquistados.has(codigo) ? '1' : '0.4'}">
      <div>${info.emoji} <strong>${info.titulo}</strong><div class="muted">${info.descricao}</div></div>
      ${conquistados.has(codigo) ? '<span class="badge badge-success">Conquistado</span>' : '<span class="badge badge-neutral">Bloqueado</span>'}
    </div>
  `).join('');
}
