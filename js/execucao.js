// ============================================================
// BORA — Execução guiada do treino
// Uma coisa de cada vez: nome do exercício, instrução em frase corrida,
// contador de série, aviso textual de descanso (sem cronômetro ativo).
// ============================================================

let execucao_exercicios = [];
let execucao_indiceAtual = 0;
let execucao_serieAtual = 1;

async function render_execucao() {
  const supabase = getSupabase();
  const ciclo = treino_cicloAtivo;
  const letra = AppState.treinoEscolhidoHoje;

  const { data } = await supabase
    .from('exercicios')
    .select('*')
    .eq('ciclo_id', ciclo.id)
    .eq('letra_treino', letra)
    .order('ordem');

  execucao_exercicios = data || [];
  execucao_indiceAtual = 0;
  execucao_serieAtual = 1;

  if (execucao_exercicios.length === 0) {
    document.getElementById('execucao-conteudo').innerHTML =
      '<p class="muted">Nenhum exercício cadastrado nesse treino ainda.</p>';
    return;
  }

  execucao_mostrarExplicacaoPrimeiraVez();
  execucao_renderizarExercicioAtual();
}

function execucao_mostrarExplicacaoPrimeiraVez() {
  const perfil = AppState.perfilAtual;
  const chave = 'bora_ja_viu_explicacao_' + perfil.id;
  if (localStorage.getItem(chave)) return;

  document.getElementById('execucao-balao-explicacao').style.display = 'block';
  localStorage.setItem(chave, '1');
}

function execucao_fecharBalao() {
  document.getElementById('execucao-balao-explicacao').style.display = 'none';
}

function execucao_renderizarExercicioAtual() {
  const ex = execucao_exercicios[execucao_indiceAtual];
  const total = execucao_exercicios.length;
  const seriesMax = ex.series_max || ex.series_min || 3;

  document.getElementById('execucao-progresso').textContent =
    `Exercício ${execucao_indiceAtual + 1} de ${total}`;
  document.getElementById('execucao-nome-exercicio').textContent = ex.nome;

  const fraseSeries = ex.series_min === ex.series_max
    ? `${ex.series_min} séries`
    : `${ex.series_min} a ${ex.series_max} séries`;
  const fraseReps = ex.reps_min === ex.reps_max
    ? `${ex.reps_min} repetições`
    : `${ex.reps_min} a ${ex.reps_max} repetições`;

  document.getElementById('execucao-instrucao').innerHTML =
    `Faça <strong>${fraseSeries}</strong>. Em cada série, repita o movimento de <strong>${fraseReps}</strong>.`;

  document.getElementById('execucao-serie-contador').innerHTML =
    `${icon('repeat', 16)} Série ${execucao_serieAtual} de ${seriesMax}`;

  document.getElementById('execucao-aviso-descanso').style.display = 'none';

  if (ex.numero_maquina) {
    document.getElementById('execucao-maquina').textContent = `Equipamento: ${ex.numero_maquina}`;
    document.getElementById('execucao-maquina').style.display = 'block';
  } else {
    document.getElementById('execucao-maquina').style.display = 'none';
  }
}

function execucao_terminarSerie() {
  const ex = execucao_exercicios[execucao_indiceAtual];
  const seriesMax = ex.series_max || ex.series_min || 3;

  if (execucao_serieAtual < seriesMax) {
    // Ainda tem série pra fazer: mostra aviso de descanso, sem cronômetro ativo
    document.getElementById('execucao-aviso-descanso').style.display = 'flex';
    document.getElementById('execucao-aviso-descanso-texto').textContent =
      `Descanse ${Math.round((ex.intervalo_segundos || 60) / 60) || 1} minuto antes da próxima série`;
    execucao_serieAtual++;
    document.getElementById('execucao-serie-contador').innerHTML =
      `${icon('repeat', 16)} Série ${execucao_serieAtual} de ${seriesMax}`;
  } else {
    execucao_proximoExercicio();
  }
}

function execucao_proximoExercicio() {
  execucao_indiceAtual++;
  execucao_serieAtual = 1;

  if (execucao_indiceAtual >= execucao_exercicios.length) {
    execucao_concluirTreino();
    return;
  }
  execucao_renderizarExercicioAtual();
}

function execucao_concluirTreino() {
  document.getElementById('modal-cansaco').style.display = 'flex';
}

function execucao_confirmarCansaco(nivel) {
  document.getElementById('modal-cansaco').style.display = 'none';
  checkin_finalizarTreino(treino_cicloAtivo.id, AppState.treinoEscolhidoHoje, nivel);
}
