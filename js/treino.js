// ============================================================
// BORA — Escolha do treino do dia (A/B) + checklist de exercícios
// ============================================================

let treino_cicloAtivo = null;
let treino_listaExercicios = [];
let treino_concluidos = new Set(); // índices já finalizados nesta sessão
let treino_horaInicio = null;

async function render_treino() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data: ciclo } = await supabase
    .from('ciclos')
    .select('*')
    .eq('perfil_id', perfil.id)
    .eq('status', 'ativo')
    .order('data_inicio', { ascending: false })
    .maybeSingle();

  const area = document.getElementById('treino-area-escolha');

  if (!ciclo) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">Ainda não tem treino aqui</div>
        <div class="empty-desc">Peça ao admin da família pra cadastrar seu ciclo atual</div>
      </div>`;
    return;
  }

  treino_cicloAtivo = ciclo;

  const { data: exercicios } = await supabase
    .from('exercicios')
    .select('letra_treino')
    .eq('ciclo_id', ciclo.id);

  const letras = [...new Set((exercicios || []).map(e => e.letra_treino))].sort();
  const contagemPorLetra = {};
  (exercicios || []).forEach(e => {
    contagemPorLetra[e.letra_treino] = (contagemPorLetra[e.letra_treino] || 0) + 1;
  });

  if (letras.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">Ciclo criado, mas sem exercícios ainda</div>
        <div class="empty-desc">Peça ao admin pra colar ou cadastrar os exercícios</div>
      </div>`;
    return;
  }

  area.innerHTML = `
    <p class="muted" style="margin-bottom:16px">Qual treino você vai fazer hoje?</p>
    <div class="grade-treinos">
      ${letras.map(l => `
        <button class="card-treino-opcao" onclick="treino_abrirLista('${l}')">
          <div class="card-treino-opcao-letra">${l}</div>
          <div class="card-treino-opcao-texto">
            <strong>Treino ${l}</strong>
            <span class="muted">${contagemPorLetra[l] || 0} exercícios</span>
          </div>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      `).join('')}
    </div>
  `;
}

async function treino_abrirLista(letra) {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('exercicios')
    .select('*')
    .eq('ciclo_id', treino_cicloAtivo.id)
    .eq('letra_treino', letra)
    .order('ordem');

  treino_listaExercicios = data || [];
  treino_concluidos = new Set();
  treino_horaInicio = new Date().toISOString();
  AppState.treinoEscolhidoHoje = letra;

  irPara('treinolista');
}

function render_treinolista() {
  const letra = AppState.treinoEscolhidoHoje;
  const total = treino_listaExercicios.length;
  const feitos = treino_concluidos.size;

  document.getElementById('treinolista-titulo').textContent = `Treino ${letra}`;
  document.getElementById('treinolista-progresso').textContent = `${feitos} de ${total} concluídos`;

  document.getElementById('treinolista-itens').innerHTML = treino_listaExercicios.map((ex, i) => {
    const feito = treino_concluidos.has(i);
    const fraseSeries = ex.series_min === ex.series_max ? `${ex.series_min}` : `${ex.series_min}-${ex.series_max}`;
    const fraseReps = ex.reps_min === ex.reps_max ? `${ex.reps_min}` : `${ex.reps_min}-${ex.reps_max}`;
    return `
      <button class="item-checklist ${feito ? 'concluido' : ''}" onclick="treino_abrirExercicio(${i})">
        <span class="item-checklist-status">${feito ? icon('check-circle', 22) : icon('circulo-vazio', 22)}</span>
        <span class="item-checklist-texto">
          <strong>${ex.nome}</strong>
          <span class="muted">${fraseSeries} séries × ${fraseReps} reps</span>
        </span>
      </button>
    `;
  }).join('');

  const areaFinalizar = document.getElementById('treinolista-finalizar');
  if (feitos === total && total > 0) {
    areaFinalizar.innerHTML = `<button class="btn btn-primary btn-full" onclick="execucao_perguntarCansaco()">Finalizar treino</button>`;
  } else {
    areaFinalizar.innerHTML = '';
  }
}

function treino_abrirExercicio(indice) {
  execucao_indiceAtual = indice;
  irPara('execucao');
}
