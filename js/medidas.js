// ============================================================
// BORA — Medidas corporais (privado, opcional, Fase 3)
// Só o próprio perfil (e Admin) vê. Nunca aparece no ranking público.
// ============================================================

async function render_medidas() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data } = await supabase
    .from('medidas_corporais')
    .select('*')
    .eq('perfil_id', perfil.id)
    .order('data', { ascending: false });

  document.getElementById('medidas-historico').innerHTML = (data || []).map(m => `
    <div class="admin-item-linha">
      <div>${formatarDataBR(m.data)}</div>
      <div class="muted">
        ${m.peso_kg ? `${m.peso_kg}kg` : ''}
        ${m.cintura_cm ? ` · cintura ${m.cintura_cm}cm` : ''}
        ${m.braco_cm ? ` · braço ${m.braco_cm}cm` : ''}
      </div>
    </div>
  `).join('') || '<p class="muted">Nenhuma medida registrada ainda.</p>';
}

async function medidas_registrar() {
  const perfil = AppState.perfilAtual;
  const peso = document.getElementById('medidas-peso').value || null;
  const cintura = document.getElementById('medidas-cintura').value || null;
  const braco = document.getElementById('medidas-braco').value || null;
  const obs = document.getElementById('medidas-obs').value || null;

  if (!peso && !cintura && !braco) {
    alert('Preencha ao menos uma medida.');
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('medidas_corporais').insert({
    perfil_id: perfil.id,
    peso_kg: peso,
    cintura_cm: cintura,
    braco_cm: braco,
    observacao: obs,
  });

  if (error) {
    alert('Não foi possível salvar.');
    return;
  }

  document.getElementById('medidas-peso').value = '';
  document.getElementById('medidas-cintura').value = '';
  document.getElementById('medidas-braco').value = '';
  document.getElementById('medidas-obs').value = '';
  render_medidas();
}
