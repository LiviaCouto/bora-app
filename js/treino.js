// ============================================================
// BORA — Escolha do treino do dia (A/B) + checklist de exercícios
// Regra importante: se o ciclo só tem UM treino dentro dele (sem
// divisão A/B de verdade), pula direto pro checklist de exercícios
// e mostra o NOME que a pessoa deu ao ciclo — nunca "Treino A" à toa.
// ============================================================

let treino_cicloAtivo = null;
let treino_listaExercicios = [];
let treino_concluidos = new Set(); // índices já finalizados nesta sessão
let treino_horaInicio = null;
let treino_ciclosAtivos = [];
let treino_totalLetrasNoCiclo = 1;

async function render_treino() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data: ciclos } = await supabase
    .from('ciclos')
    .select('*')
    .eq('perfil_id', perfil.id)
    .eq('status', 'ativo')
    .order('data_inicio', { ascending: false });

  const area = document.getElementById('treino-area-escolha');
  treino_ciclosAtivos = ciclos || [];

  if (!ciclos || ciclos.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">Ainda não tem treino aqui</div>
        <div class="empty-desc">Toque no ícone de lápis acima pra cadastrar seu ciclo</div>
      </div>`;
    return;
  }

  if (ciclos.length === 1) {
    await treino_selecionarCiclo(ciclos[0]);
    return;
  }

  // Mais de um ciclo ativo — deixa escolher qual treinar agora
  area.innerHTML = `
    <p class="muted" style="margin-bottom:16px">Você tem mais de um ciclo ativo. Qual vamos treinar?</p>
    <div class="grade-treinos">
      ${ciclos.map((c, i) => `
        <button class="card-treino-opcao" onclick='treino_selecionarCicloPorIndice(${i})'>
          <div class="card-treino-opcao-letra">${icon('dumbbell', 20)}</div>
          <div class="card-treino-opcao-texto">
            <strong>${c.nome_ciclo || 'Ciclo desde ' + formatarDataBR(c.data_inicio)}</strong>
            <span class="muted">${c.nome_academia || 'Toque para escolher'}</span>
          </div>
        </button>
      `).join('')}
    </div>
  `;
}

function treino_selecionarCicloPorIndice(i) {
  treino_selecionarCiclo(treino_ciclosAtivos[i]);
}

async function treino_selecionarCiclo(ciclo) {
  treino_cicloAtivo = ciclo;
  const supabase = getSupabase();

  const { data: exercicios } = await supabase
    .from('exercicios')
    .select('letra_treino')
    .eq('ciclo_id', ciclo.id);

  const letras = [...new Set((exercicios || []).map(e => e.letra_treino))].sort();
  treino_totalLetrasNoCiclo = letras.length;

  const area = document.getElementById('treino-area-escolha');

  if (letras.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">Ciclo criado, mas sem exercícios ainda</div>
        <div class="empty-desc">Toque no ícone de lápis acima pra cadastrar</div>
      </div>`;
    return;
  }

  // Só UM treino dentro do ciclo (o caso mais comum agora) — pula
  // direto pro checklist, sem mostrar uma tela de escolha com 1 opção só.
  if (letras.length === 1) {
    await treino_abrirLista(letras[0]);
    return;
  }

  const contagemPorLetra = {};
  (exercicios || []).forEach(e => {
    contagemPorLetra[e.letra_treino] = (contagemPorLetra[e.letra_treino] || 0) + 1;
  });

  area.innerHTML = `
    <p class="muted" style="margin-bottom:16px">${treino_cicloAtivo.nome_ciclo || 'Ciclo'} — qual treino?</p>
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

  // Só mostra "Treino A/B" quando o ciclo REALMENTE tem mais de um treino
  // dentro dele. Se for só um, mostra o nome que a pessoa deu ao ciclo.
  const titulo = treino_totalLetrasNoCiclo > 1
    ? `Treino ${letra}`
    : (treino_cicloAtivo.nome_ciclo || `Treino ${letra}`);

  document.getElementById('treinolista-titulo').textContent = titulo;
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
