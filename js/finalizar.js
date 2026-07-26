// ============================================================
// BORA — Finalização do treino (revisão de horário + celebração)
// ============================================================

let finalizar_nivelCansacoEscolhido = null;

function finalizar_abrirRevisao(nivel) {
  finalizar_nivelCansacoEscolhido = nivel;

  const inicio = new Date(treino_horaInicio);
  const fim = new Date();

  document.getElementById('finalizar-hora-inicio').value = formatarHoraInput(inicio);
  document.getElementById('finalizar-hora-fim').value = formatarHoraInput(fim);
  document.getElementById('modal-finalizar').style.display = 'flex';
}

function formatarHoraInput(data) {
  const h = String(data.getHours()).padStart(2, '0');
  const m = String(data.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

async function finalizar_salvarTreino() {
  const horaInicioStr = document.getElementById('finalizar-hora-inicio').value;
  const horaFimStr = document.getElementById('finalizar-hora-fim').value;
  const hoje = todayLocal();

  const horaInicioISO = new Date(`${hoje}T${horaInicioStr}:00`).toISOString();
  const horaFimISO = new Date(`${hoje}T${horaFimStr}:00`).toISOString();

  document.getElementById('modal-finalizar').style.display = 'none';

  await checkin_finalizarTreino(
    treino_cicloAtivo.id,
    AppState.treinoEscolhidoHoje,
    finalizar_nivelCansacoEscolhido,
    horaInicioISO,
    horaFimISO
  );

  finalizar_mostrarCelebracao();
}

function finalizar_mostrarCelebracao() {
  document.getElementById('modal-celebracao').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('modal-celebracao').style.display = 'none';
    irPara('progresso');
  }, 1800);
}
