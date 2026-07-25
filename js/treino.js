// ============================================================
// BORA — Escolha do treino do dia (A ou B)
// ============================================================

let treino_cicloAtivo = null;

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

  area.innerHTML = `
    <p class="muted" style="margin-bottom:16px">Qual treino você vai fazer hoje?</p>
    <div class="flex-wrap-botoes">
      ${letras.map(l => `
        <button class="btn btn-primary btn-lg" onclick="treino_iniciarExecucao('${l}')">Treino ${l}</button>
      `).join('')}
    </div>
  `;
}

function treino_iniciarExecucao(letra) {
  AppState.treinoEscolhidoHoje = letra;
  irPara('execucao');
}
