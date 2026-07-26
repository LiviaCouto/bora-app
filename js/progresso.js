// ============================================================
// BORA — Progresso (calendário mensal de assiduidade)
// ============================================================

let progresso_anoExibido;
let progresso_mesExibido; // 0-indexado (0 = janeiro)

const NOMES_MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

async function render_progresso() {
  const hoje = new Date();
  progresso_anoExibido = hoje.getFullYear();
  progresso_mesExibido = hoje.getMonth();
  await progresso_renderizarCalendario();
}

async function progresso_renderizarCalendario() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const ultimoDiaMes = new Date(progresso_anoExibido, progresso_mesExibido + 1, 0).getDate();
  const mesStr = String(progresso_mesExibido + 1).padStart(2, '0');
  const inicioStr = `${progresso_anoExibido}-${mesStr}-01`;
  const fimStr = `${progresso_anoExibido}-${mesStr}-${String(ultimoDiaMes).padStart(2, '0')}`;

  const { data: checkins } = await supabase
    .from('checkins')
    .select('data')
    .eq('perfil_id', perfil.id)
    .gte('data', inicioStr)
    .lte('data', fimStr);

  const diasComCheckin = new Set((checkins || []).map(c => c.data));

  document.getElementById('progresso-mes-titulo').textContent =
    `${NOMES_MES[progresso_mesExibido]} ${progresso_anoExibido}`;

  const primeiroDiaSemana = new Date(progresso_anoExibido, progresso_mesExibido, 1).getDay();
  const hoje = new Date();
  const ehMesAtual = progresso_anoExibido === hoje.getFullYear() && progresso_mesExibido === hoje.getMonth();

  let html = '';
  for (let i = 0; i < primeiroDiaSemana; i++) {
    html += '<div class="calendario-dia vazio"></div>';
  }
  for (let d = 1; d <= ultimoDiaMes; d++) {
    const dataStr = `${progresso_anoExibido}-${mesStr}-${String(d).padStart(2, '0')}`;
    const marcado = diasComCheckin.has(dataStr);
    const futuro = ehMesAtual && d > hoje.getDate();
    const ehHoje = ehMesAtual && d === hoje.getDate();
    const onclick = marcado ? `onclick="celebracao_disparar()"` : '';
    html += `<div class="calendario-dia ${marcado ? 'marcado' : ''} ${futuro ? 'futuro' : ''} ${ehHoje ? 'hoje' : ''}" ${onclick} style="${marcado ? 'cursor:pointer' : ''}">${d}</div>`;
  }
  document.getElementById('progresso-calendario-dias').innerHTML = html;

  const podeAvancar = !ehMesAtual;
  const setaFrente = document.getElementById('progresso-seta-frente');
  setaFrente.style.visibility = podeAvancar ? 'visible' : 'hidden';
}

function progresso_mesAnterior() {
  progresso_mesExibido--;
  if (progresso_mesExibido < 0) {
    progresso_mesExibido = 11;
    progresso_anoExibido--;
  }
  progresso_renderizarCalendario();
}

function progresso_mesSeguinte() {
  const hoje = new Date();
  if (progresso_anoExibido === hoje.getFullYear() && progresso_mesExibido === hoje.getMonth()) return;
  progresso_mesExibido++;
  if (progresso_mesExibido > 11) {
    progresso_mesExibido = 0;
    progresso_anoExibido++;
  }
  progresso_renderizarCalendario();
}
