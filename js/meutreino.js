// ============================================================
// BORA — Meu Treino (qualquer perfil gerencia o PRÓPRIO ciclo)
// Diferente do Admin → Treinos: aqui só dá pra editar manualmente
// ou pela biblioteca — o upload por texto colado (MD) é exclusivo do admin.
// ============================================================

let meutreino_cicloEmEdicao = null;
let meutreino_bibliotecaIdSelecionado = null;

function meutreino_escolherDaBiblioteca() {
  biblioteca_abrirSeletor((id, nome) => {
    meutreino_bibliotecaIdSelecionado = id;
    document.getElementById('meutreino-ex-nome').value = nome;
  });
}

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
        <button class="btn btn-outline btn-sm" onclick="meutreino_editarExercicios('${c.id}')">Editar exercícios</button>
        <button class="btn btn-danger btn-sm" onclick="meutreino_apagarCiclo('${c.id}')">Excluir</button>
      </div>
    </div>
  `).join('') || '<p class="muted">Você ainda não tem nenhum ciclo. Crie um abaixo.</p>';

  document.getElementById('meutreino-painel-exercicios').style.display = 'none';
}

async function meutreino_criarCiclo() {
  const perfil = AppState.perfilAtual;
  const nomeCiclo = document.getElementById('meutreino-ciclo-nome').value.trim();
  const academia = document.getElementById('meutreino-ciclo-academia').value.trim();
  const responsavel = document.getElementById('meutreino-ciclo-responsavel').value.trim();
  const dataFim = document.getElementById('meutreino-ciclo-fim').value;

  const supabase = getSupabase();
  const { error } = await supabase.from('ciclos').insert({
    perfil_id: perfil.id,
    data_inicio: todayLocal(),
    data_fim_prevista: dataFim || null,
    nome_ciclo: nomeCiclo || null,
    nome_academia: academia || null,
    responsavel_nome: responsavel || null,
  });

  if (error) {
    alert('Não foi possível criar o ciclo.');
    return;
  }

  document.getElementById('meutreino-ciclo-nome').value = '';
  document.getElementById('meutreino-ciclo-academia').value = '';
  document.getElementById('meutreino-ciclo-responsavel').value = '';
  document.getElementById('meutreino-ciclo-fim').value = '';
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
  await meutreino_atualizarSelectDeTreinos();
  await meutreino_listarExercicios();
}

async function meutreino_atualizarSelectDeTreinos() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('exercicios')
    .select('letra_treino')
    .eq('ciclo_id', meutreino_cicloEmEdicao);

  const letras = [...new Set((data || []).map(e => e.letra_treino))].sort();
  const select = document.getElementById('meutreino-ex-letra-select');
  select.innerHTML = letras.map(l => `<option value="${l}">Treino ${l}</option>`).join('') +
    `<option value="__novo__">+ Criar novo treino</option>`;
  meutreino_alternarNovoTreino();
}

function meutreino_alternarNovoTreino() {
  const select = document.getElementById('meutreino-ex-letra-select');
  const campoNovo = document.getElementById('meutreino-ex-letra-novo');
  campoNovo.style.display = select.value === '__novo__' ? 'block' : 'none';
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
  const selectLetra = document.getElementById('meutreino-ex-letra-select').value;
  const letra = (selectLetra === '__novo__'
    ? document.getElementById('meutreino-ex-letra-novo').value.trim()
    : selectLetra).toUpperCase();
  const nome = document.getElementById('meutreino-ex-nome').value.trim();
  const numeroMaquina = document.getElementById('meutreino-ex-maquina').value.trim();
  const seriesMin = parseInt(document.getElementById('meutreino-ex-series-min').value) || 2;
  const seriesMax = parseInt(document.getElementById('meutreino-ex-series-max').value) || 3;
  const repsMin = parseInt(document.getElementById('meutreino-ex-reps-min').value) || 8;
  const repsMax = parseInt(document.getElementById('meutreino-ex-reps-max').value) || 12;
  const intervalo = parseInt(document.getElementById('meutreino-ex-intervalo').value) || 60;

  if (!letra || !nome) {
    alert('Preencha ao menos o treino e o nome do exercício.');
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('exercicios').insert({
    ciclo_id: meutreino_cicloEmEdicao,
    letra_treino: letra,
    biblioteca_exercicio_id: meutreino_bibliotecaIdSelecionado,
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
  meutreino_bibliotecaIdSelecionado = null;
  meutreino_atualizarSelectDeTreinos();
  meutreino_listarExercicios();
}

async function meutreino_apagarExercicio(id) {
  const confirmado = confirm('Excluir esse exercício do treino? Não tem como desfazer.');
  if (!confirmado) return;
  const supabase = getSupabase();
  await supabase.from('exercicios').delete().eq('id', id);
  meutreino_listarExercicios();
}
