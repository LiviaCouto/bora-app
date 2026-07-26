// ============================================================
// BORA — Execução guiada do treino
// Uma coisa de cada vez: nome do exercício, instrução em frase corrida,
// contador de série, aviso textual de descanso (sem cronômetro ativo).
// Ao concluir um exercício, volta pra checklist (treino.js cuida da lista).
// ============================================================

let execucao_indiceAtual = 0;
let execucao_serieAtual = 1;

function render_execucao() {
  execucao_serieAtual = 1;
  document.getElementById('execucao-balao-explicacao').style.display = 'none';
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
  const ex = treino_listaExercicios[execucao_indiceAtual];
  const total = treino_listaExercicios.length;
  const seriesMax = ex.series_max || ex.series_min || 3;

  document.getElementById('execucao-progresso').textContent =
    `Treino ${AppState.treinoEscolhidoHoje} · Exercício ${execucao_indiceAtual + 1} de ${total}`;
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

  // Vídeo do YouTube (se já vinculado a esse exercício)
  const areaVideo = document.getElementById('execucao-video');
  if (ex.video_id) {
    areaVideo.innerHTML = `
      <div class="video-wrap">
        <iframe src="https://www.youtube.com/embed/${ex.video_id}" frameborder="0" allowfullscreen></iframe>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="youtube_buscarParaExercicio('${ex.id}', '${ex.nome.replace(/'/g, "\\'")}')">Trocar vídeo</button>
    `;
  } else {
    areaVideo.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="youtube_buscarParaExercicio('${ex.id}', '${ex.nome.replace(/'/g, "\\'")}')">${icon('video', 14)} Vincular vídeo de execução</button>
    `;
  }
}

function execucao_terminarSerie() {
  const ex = treino_listaExercicios[execucao_indiceAtual];
  const seriesMax = ex.series_max || ex.series_min || 3;

  if (execucao_serieAtual < seriesMax) {
    document.getElementById('execucao-aviso-descanso').style.display = 'flex';
    document.getElementById('execucao-aviso-descanso-texto').textContent =
      `Descanse ${Math.round((ex.intervalo_segundos || 60) / 60) || 1} minuto antes da próxima série`;
    execucao_serieAtual++;
    document.getElementById('execucao-serie-contador').innerHTML =
      `${icon('repeat', 16)} Série ${execucao_serieAtual} de ${seriesMax}`;
  } else {
    execucao_concluirExercicioAtual();
  }
}

function execucao_concluirExercicioAtual() {
  treino_concluidos.add(execucao_indiceAtual);
  irPara('treinolista');
}

// Chamado pelo botão "Finalizar treino" na checklist, quando todos concluídos
function execucao_perguntarCansaco() {
  document.getElementById('modal-cansaco').style.display = 'flex';
}

function execucao_confirmarCansaco(nivel) {
  document.getElementById('modal-cansaco').style.display = 'none';
  checkin_finalizarTreino(treino_cicloAtivo.id, AppState.treinoEscolhidoHoje, nivel, treino_horaInicio, new Date().toISOString());
}
