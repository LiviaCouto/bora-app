// ============================================================
// BORA — Meu Treino (qualquer perfil gerencia o PRÓPRIO ciclo)
// Diferente do Admin → Treinos: aqui só dá pra editar manualmente,
// o upload por texto colado (MD) continua exclusivo do admin.
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
      <div>Ciclo desde ${formatarDataBR(c.data_inicio)} <span class="badge ${c.status === 'ativo' ? 'badge-success' : 'badge-neutral'}">${c.status}</span></div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="meutreino_editarExercicios('${c.id}')">Editar exercícios</button>
        <button class="btn btn-danger btn-sm" onclick="meutreino_apagarCiclo('${c.id}')">Excluir</button>
      </div>
    </div>
  `).join('') || '<p class="muted">Você ainda não tem nenhum ciclo. Crie um abaixo.</p>';

  document.getElementById('meutreino-painel-exercicios').style.display = 'none';
}

async function meutreino_criarCiclo() {
  const perfil = AppState.perfilAtual;
  const responsavel = document.getElementById('meutreino-ciclo-responsavel').value.trim();
  const cref = document.getElementById('meutreino-ciclo-cref').value.trim();

  const supabase = getSupabase();
  const { error } = await supabase.from('ciclos').insert({
    perfil_id: perfil.id,
    data_inicio: todayLocal(),
    responsavel_nome: responsavel || null,
    responsavel_cref: cref || null,
  });

  if (error) {
    alert('Não foi possível criar o ciclo.');
    return;
  }

  document.getElementById('meutreino-ciclo-responsavel').value = '';
  document.getElementById('meutreino-ciclo-cref').value = '';
  render_meutreino();
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

  document.getElementById('meutreino-lista-exercicios').innerHTML = (data || []).map(e => `
    <div class="admin-item-linha">
      <div><strong>Treino ${e.letra_treino}</strong> — ${e.nome} (${e.series_min}-${e.series_max} séries × ${e.reps_min}-${e.reps_max} reps)</div>
      <button class="btn btn-danger btn-sm" onclick="meutreino_apagarExercicio('${e.id}')">Excluir</button>
    </div>
  `).join('') || '<p class="muted">Nenhum exercício cadastrado neste ciclo ainda.</p>';
}

async function meutreino_adicionarExercicio() {
  const letra = document.getElementById('meutreino-ex-letra').value.trim().toUpperCase();
  const nome = document.getElementById('meutreino-ex-nome').value.trim();
  const numeroMaquina = document.getElementById('meutreino-ex-maquina').value.trim();
  const seriesMin = parseInt(document.getElementById('meutreino-ex-series-min').value) || 2;
  const seriesMax = parseInt(document.getElementById('meutreino-ex-series-max').value) || 3;
  const repsMin = parseInt(document.getElementById('meutreino-ex-reps-min').value) || 8;
  const repsMax = parseInt(document.getElementById('meutreino-ex-reps-max').value) || 12;
  const intervalo = parseInt(document.getElementById('meutreino-ex-intervalo').value) || 60;

  if (!letra || !nome) {
    alert('Preencha ao menos a letra do treino e o nome do exercício.');
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('exercicios').insert({
    ciclo_id: meutreino_cicloEmEdicao,
    letra_treino: letra,
    nome,
    numero_maquina: numeroMaquina || null,
    series_min: seriesMin,
    series_max: seriesMax,
    reps_min: repsMin,
    reps_max: repsMax,
    intervalo_segundos: intervalo,
  });

  if (error) {
    alert('Não foi possível adicionar o exercício.');
    return;
  }

  document.getElementById('meutreino-ex-nome').value = '';
  document.getElementById('meutreino-ex-maquina').value = '';
  meutreino_listarExercicios();
}

async function meutreino_apagarExercicio(id) {
  const supabase = getSupabase();
  await supabase.from('exercicios').delete().eq('id', id);
  meutreino_listarExercicios();
}
