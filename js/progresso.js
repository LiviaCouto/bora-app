// ============================================================
// BORA — Progresso (assiduidade + evolução de carga)
// ============================================================

async function render_progresso() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data: checkins } = await supabase
    .from('checkins')
    .select('data')
    .eq('perfil_id', perfil.id)
    .order('data', { ascending: false })
    .limit(98); // ~14 semanas

  progresso_renderizarHeatmap(checkins || []);

  const { data: cargas } = await supabase
    .from('progresso_cargas')
    .select('*')
    .eq('perfil_id', perfil.id)
    .order('data');

  progresso_renderizarGraficoCarga(cargas || []);
}

function progresso_renderizarHeatmap(checkins) {
  const datasComCheckin = new Set(checkins.map(c => c.data));
  const container = document.getElementById('progresso-heatmap');
  let html = '';

  const hoje = new Date();
  for (let i = 97; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ativo = datasComCheckin.has(iso);
    html += `<div class="heatmap-dia ${ativo ? 'ativo' : ''}" title="${formatarDataBR(iso)}"></div>`;
  }
  container.innerHTML = html;
}

let progresso_chart = null;

function progresso_renderizarGraficoCarga(cargas) {
  const canvas = document.getElementById('progresso-grafico-carga');
  if (!canvas || typeof Chart === 'undefined') return;

  if (cargas.length === 0) {
    canvas.parentElement.innerHTML = '<p class="muted">Ainda não há histórico de carga registrado.</p>';
    return;
  }

  const porExercicio = {};
  cargas.forEach(c => {
    if (!porExercicio[c.exercicio_nome]) porExercicio[c.exercicio_nome] = [];
    porExercicio[c.exercicio_nome].push({ x: c.data, y: c.carga_kg });
  });

  if (progresso_chart) progresso_chart.destroy();

  const cores = ['#FF5A3C', '#0E4F4A', '#FFC93C', '#E63977'];
  const datasets = Object.keys(porExercicio).map((nome, i) => ({
    label: nome,
    data: porExercicio[nome],
    borderColor: cores[i % cores.length],
    backgroundColor: cores[i % cores.length],
    tension: 0.3,
  }));

  progresso_chart = new Chart(canvas, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      scales: { x: { type: 'time', time: { unit: 'week' } } },
    },
  });
}
