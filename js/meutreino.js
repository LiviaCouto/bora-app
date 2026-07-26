// ============================================================
// BORA — Meu Treino (qualquer perfil gerencia o PRÓPRIO ciclo)
// A criação em si (foto/MD/manual) agora vive em criartreino.js —
// aqui só listamos os ciclos e os exercícios já cadastrados.
// ============================================================

let meutreino_cicloEmEdicao = null;

async function render_meutreino() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data } = await supabase
    .from('ciclos')
    .select('*')
    .eq('perfil_id', perfil.id)
    .order('data_inicio', { ascending: false });

  document.getElementById('meutreino-lista-ciclos').innerHTML = (data || []).map(c => `
    <div class="admin-item-linha">
      <div>
        <strong>${c.nome_ciclo || ('Ciclo desde ' + formatarDataBR(c.data_inicio))}</strong>
        <span class="badge ${c.status === 'ativo' ? 'badge-success' : 'badge-neutral'}">${c.status}</span>
        <div class="muted" style="font-size:11px">${c.nome_academia || ''}${c.data_fim_prevista ? ' · até ' + formatarDataBR(c.data_fim_prevista) : ''}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="meutreino_editarExercicios('${c.id}')">Ver exercícios</button>
        <button class="btn btn-danger btn-sm" onclick="meutreino_apagarCiclo('${c.id}')">Excluir</button>
      </div>
    </div>
  `).join('') || '<p class="muted">Você ainda não tem nenhum ciclo. Crie um acima.</p>';

  document.getElementById('meutreino-painel-exercicios').style.display = 'none';
}

async function meutreino_apagarCiclo(cicloId) {
  const confirmado = confirm('Excluir esse ciclo? Todos os exercícios, o histórico de check-in e o progresso vinculados a ele serão perdidos e não tem como desfazer.');
  if (!confirmado) return;

  const supabase = getSupabase();
  const { error } = await supabase.from('ciclos').delete().eq('id', cicloId);
  if (error) {
    alert('Não foi possível excluir o ciclo.');
    return;
  }
  render_meutreino();
}

async function meutreino_editarExercicios(cicloId) {
  meutreino_cicloEmEdicao = cicloId;
  document.getElementById('meutreino-painel-exercicios').style.display = 'block';
  await meutreino_listarExercicios();
}

async function meutreino_listarExercicios() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('exercicios')
    .select('*')
    .eq('ciclo_id', meutreino_cicloEmEdicao)
    .order('letra_treino')
    .order('ordem');

  document.getElementById('meutreino-lista-exercicios').innerHTML = `
    <button class="btn btn-outline btn-full" style="margin-bottom:12px" onclick="criartreino_continuarComCicloExistente('${meutreino_cicloEmEdicao}', AppState.perfilAtual.id, 'meutreino')">+ Adicionar mais exercícios</button>
    ${(data || []).map(e => `
      <div class="admin-item-linha">
        <div><strong>Treino ${e.letra_treino}</strong> — ${e.nome} (${e.series_min}-${e.series_max} séries × ${e.reps_min}-${e.reps_max} reps)</div>
        <button class="btn btn-danger btn-sm" onclick="meutreino_apagarExercicio('${e.id}')">Excluir</button>
      </div>
    `).join('') || '<p class="muted">Nenhum exercício cadastrado neste ciclo ainda.</p>'}
  `;
}

async function meutreino_apagarExercicio(id) {
  const confirmado = confirm('Excluir esse exercício do treino? Não tem como desfazer.');
  if (!confirmado) return;
  const supabase = getSupabase();
  await supabase.from('exercicios').delete().eq('id', id);
  meutreino_listarExercicios();
}
