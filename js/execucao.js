// ============================================================
// BORA — Execução guiada do treino (simplificada: 1 clique por exercício)
// Ao concluir um exercício, mostra tela de descanso e volta pra checklist.
// ============================================================

let execucao_indiceAtual = 0;

function render_execucao() {
  document.getElementById('execucao-balao-explicacao').style.display = 'none';
  document.getElementById('execucao-card-descanso').style.display = 'none';
  document.getElementById('execucao-card-exercicio').style.display = 'block';
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

  const progresso = Math.round((treino_concluidos.size / total) * 100);
  document.getElementById('execucao-barra-preenchida').style.width = `${progresso}%`;

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
    `Faça <strong>${fraseSeries}</strong> de <strong>${fraseReps}</strong> cada uma.`;

  if (ex.numero_maquina) {
    document.getElementById('execucao-maquina').textContent = `Equipamento: ${ex.numero_maquina}`;
    document.getElementById('execucao-maquina').style.display = 'block';
  } else {
    document.getElementById('execucao-maquina').style.display = 'none';
  }

  const areaVideo = document.getElementById('execucao-video');
  if (ex.video_id) {
    areaVideo.innerHTML = `
      <div class="video-wrap">
        <iframe src="https://www.youtube.com/embed/${ex.video_id}" frameborder="0" allowfullscreen></iframe>
      </div>
      <button class="btn btn-outline-claro btn-sm" onclick="youtube_buscarParaExercicio('${ex.id}', '${ex.nome.replace(/'/g, "\\'")}')">Trocar vídeo</button>
    `;
  } else {
    areaVideo.innerHTML = `
      <button class="btn btn-outline-claro btn-sm" onclick="youtube_buscarParaExercicio('${ex.id}', '${ex.nome.replace(/'/g, "\\'")}')">${icon('video', 14)} Vincular vídeo de execução</button>
    `;
  }
}

function execucao_concluirExercicioAtual() {
  treino_concluidos.add(execucao_indiceAtual);
  document.getElementById('execucao-card-exercicio').style.display = 'none';
  document.getElementById('execucao-card-descanso').style.display = 'block';
}

function execucao_continuarAposDescanso() {
  irPara('treinolista');
}

// Chamado pelo botão "Finalizar treino" na checklist, quando todos concluídos
function execucao_perguntarCansaco() {
  document.getElementById('modal-cansaco').style.display = 'flex';
}

function execucao_confirmarCansaco(nivel) {
  document.getElementById('modal-cansaco').style.display = 'none';
  finalizar_abrirRevisao(nivel);
}
