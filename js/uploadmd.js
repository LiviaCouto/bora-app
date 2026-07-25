// ============================================================
// BORA — Upload de treino via texto colado (parser automático)
// Reconhece o padrão real da academia: "Treino A" / "Treino B" com
// linhas tipo "* Exercício — 2 a 3 / 8 a 12 / 1 min" ou variações.
// Sempre mostra prévia pra revisão ANTES de salvar (nunca salva direto).
// ============================================================

let uploadmd_exerciciosDetectados = [];

function uploadmd_processar() {
  const texto = document.getElementById('uploadmd-textarea').value;
  if (!texto.trim()) {
    alert('Cole o texto do treino primeiro.');
    return;
  }

  uploadmd_exerciciosDetectados = uploadmd_parsear(texto);
  uploadmd_renderizarPreview();
}

// Parser tolerante: procura blocos "Treino X" e, dentro deles, linhas com
// nome do exercício + números de série/rep/intervalo em qualquer ordem razoável.
function uploadmd_parsear(texto) {
  const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  const resultado = [];
  let letraAtual = 'A';
  let ordem = 0;

  const regexTreino = /treino\s*([A-Za-z])/i;
  // Captura padrões como "2 a 3", "8 a 12", "1 min" em qualquer lugar da linha
  const regexSeries = /(\d+)\s*a\s*(\d+)\s*(?:séries|series)?/i;
  const regexIntervalo = /(\d+)\s*min/i;

  linhas.forEach(linha => {
    const matchTreino = linha.match(regexTreino);
    if (matchTreino && linha.length < 20) {
      letraAtual = matchTreino[1].toUpperCase();
      ordem = 0;
      return;
    }

    // Linha de exercício: começa com marcador de lista ou tem " — " / " - "
    const limpa = linha.replace(/^[-*•]\s*/, '');
    if (!limpa || regexTreino.test(limpa) === false && !/[a-zA-Zà-ú]/.test(limpa)) return;

    const partes = limpa.split(/—|--|:/);
    if (partes.length < 1) return;

    const nomeBruto = partes[0].trim();
    const resto = partes.slice(1).join(' ');

    // Ignora linhas que claramente não são exercício (muito curtas ou só números)
    if (!nomeBruto || nomeBruto.length < 3) return;

    // Extrai número de máquina entre parênteses, ex: "Rosca alternada (CH)"
    let nome = nomeBruto;
    let numeroMaquina = null;
    const matchMaquina = nomeBruto.match(/\(([^)]+)\)/);
    if (matchMaquina) {
      numeroMaquina = matchMaquina[1];
      nome = nomeBruto.replace(/\([^)]+\)/, '').trim();
    }

    const textoCompleto = resto || limpa;
    const matchSeries = textoCompleto.match(regexSeries);
    const matchIntervalo = textoCompleto.match(regexIntervalo);
    // Repetições costuma ser o segundo padrão "X a Y" da linha
    const todasFaixas = [...textoCompleto.matchAll(/(\d+)\s*a\s*(\d+)/gi)];

    const seriesMin = todasFaixas[0] ? parseInt(todasFaixas[0][1]) : 2;
    const seriesMax = todasFaixas[0] ? parseInt(todasFaixas[0][2]) : 3;
    const repsMin = todasFaixas[1] ? parseInt(todasFaixas[1][1]) : 8;
    const repsMax = todasFaixas[1] ? parseInt(todasFaixas[1][2]) : 12;
    const intervalo = matchIntervalo ? parseInt(matchIntervalo[1]) * 60 : 60;

    if (!nome || nome.length < 3) return;

    resultado.push({
      letra_treino: letraAtual,
      nome,
      numero_maquina: numeroMaquina,
      series_min: seriesMin,
      series_max: seriesMax,
      reps_min: repsMin,
      reps_max: repsMax,
      intervalo_segundos: intervalo,
      ordem: ordem++,
    });
  });

  return resultado;
}

function uploadmd_renderizarPreview() {
  const container = document.getElementById('uploadmd-preview');

  if (uploadmd_exerciciosDetectados.length === 0) {
    container.innerHTML = '<p class="erro-msg">Não consegui reconhecer exercícios nesse texto. Tente colar novamente ou use o formulário manual.</p>';
    return;
  }

  container.innerHTML = `
    <p class="muted" style="margin-bottom:10px">Confira antes de salvar — nada foi gravado ainda:</p>
    ${uploadmd_exerciciosDetectados.map((e, i) => `
      <div class="admin-item-linha">
        <div>
          <strong>Treino ${e.letra_treino}</strong> — ${e.nome}
          ${e.numero_maquina ? ` (${e.numero_maquina})` : ''}
          <div class="muted">${e.series_min}-${e.series_max} séries × ${e.reps_min}-${e.reps_max} reps · ${e.intervalo_segundos/60} min descanso</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="uploadmd_remover(${i})">Remover</button>
      </div>
    `).join('')}
    <button class="btn btn-primary btn-full" style="margin-top:16px" onclick="uploadmd_confirmarSalvar()">Confirmar e salvar no ciclo</button>
  `;
}

function uploadmd_remover(indice) {
  uploadmd_exerciciosDetectados.splice(indice, 1);
  uploadmd_renderizarPreview();
}

async function uploadmd_confirmarSalvar() {
  if (!admin_cicloEmEdicao) {
    alert('Abra um ciclo em "Gerenciar exercícios" antes de importar.');
    return;
  }

  const supabase = getSupabase();
  const linhas = uploadmd_exerciciosDetectados.map(e => ({ ...e, ciclo_id: admin_cicloEmEdicao }));

  const { error } = await supabase.from('exercicios').insert(linhas);
  if (error) {
    alert('Não foi possível salvar os exercícios importados.');
    console.error(error);
    return;
  }

  document.getElementById('uploadmd-textarea').value = '';
  document.getElementById('uploadmd-preview').innerHTML = '';
  uploadmd_exerciciosDetectados = [];
  admin_listarExercicios();
  alert('Treino importado com sucesso!');
}
