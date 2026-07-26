// ============================================================
// BORA — Criar treino (fluxo unificado: escolhe o método primeiro)
// Usado tanto por "Meu Treino" quanto pelo Admin (parametrizado
// pelo perfilId e pela tela de retorno).
// ============================================================

let criartreino_perfilId = null;
let criartreino_telaRetorno = 'meutreino';
let criartreino_cicloIdCriado = null;
let criartreino_grupoAtual = null;
let criartreino_contadorAdicionados = 0;

function criartreino_continuarComCicloExistente(cicloId, perfilId, telaRetorno) {
  criartreino_perfilId = perfilId;
  criartreino_telaRetorno = telaRetorno;
  criartreino_cicloIdCriado = cicloId;
  criartreino_contadorAdicionados = 0;

  irPara('criartreino');
  document.querySelectorAll('#secao-criartreino .criartreino-passo').forEach(el => el.style.display = 'none');
  criartreino_manualMostrarGrupos();
}

function criartreino_iniciar(perfilId, telaRetorno) {
  criartreino_perfilId = perfilId;
  criartreino_telaRetorno = telaRetorno;
  criartreino_cicloIdCriado = null;
  criartreino_contadorAdicionados = 0;

  document.querySelectorAll('#secao-criartreino .criartreino-passo').forEach(el => el.style.display = 'none');
  document.getElementById('criartreino-passo-metodo').style.display = 'block';
  document.getElementById('criartreino-ciclo-nome').value = '';
  document.getElementById('criartreino-ciclo-prof').value = '';
  document.getElementById('criartreino-ciclo-academia').value = '';
  document.getElementById('fototreino-input-1').value = '';
  document.getElementById('fototreino-input-2').value = '';
  document.getElementById('fototreino-status').textContent = '';

  irPara('criartreino');
}

function criartreino_voltar() {
  irPara(criartreino_telaRetorno);
}

function criartreino_escolherMetodo(metodo) {
  document.getElementById('criartreino-passo-metodo').style.display = 'none';

  if (metodo === 'foto') {
    document.getElementById('criartreino-passo-foto').style.display = 'block';
  } else {
    criartreino_metodoEscolhido = metodo;
    document.getElementById('criartreino-passo-cicloform').style.display = 'block';
  }
}

let criartreino_metodoEscolhido = null;

async function criartreino_continuarAposCiclo() {
  const nome = document.getElementById('criartreino-ciclo-nome').value.trim();
  if (!nome) {
    alert('Dá um nome pro treino (ex: "Ciclo Julho/Agosto").');
    return;
  }
  const prof = document.getElementById('criartreino-ciclo-prof').value.trim();
  const academia = document.getElementById('criartreino-ciclo-academia').value.trim();

  const supabase = getSupabase();
  const { data, error } = await supabase.from('ciclos').insert({
    perfil_id: criartreino_perfilId,
    data_inicio: todayLocal(),
    nome_ciclo: nome,
    nome_academia: academia || null,
    responsavel_nome: prof || null,
  }).select().single();

  if (error) {
    alert('Não foi possível criar o ciclo.');
    console.error(error);
    return;
  }

  criartreino_cicloIdCriado = data.id;
  document.getElementById('criartreino-passo-cicloform').style.display = 'none';

  if (criartreino_metodoEscolhido === 'md') {
    document.getElementById('criartreino-passo-md').style.display = 'block';
  } else {
    criartreino_manualMostrarGrupos();
  }
}

// ---------- MÉTODO: FOTO (até 2 fotos, sem precisar de ciclo) ----------

async function criartreino_enviarFotos() {
  const arquivo1 = document.getElementById('fototreino-input-1').files[0];
  const arquivo2 = document.getElementById('fototreino-input-2').files[0];
  const arquivos = [arquivo1, arquivo2].filter(Boolean);

  if (arquivos.length === 0) {
    alert('Escolha ao menos uma foto.');
    return;
  }

  const perfil = { id: criartreino_perfilId };
  const supabase = getSupabase();
  document.getElementById('fototreino-status').textContent = 'Enviando...';

  for (const arquivo of arquivos) {
    const nomeArquivo = `${perfil.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error: erroUpload } = await supabase.storage.from('fotos-treino').upload(nomeArquivo, arquivo);
    if (erroUpload) {
      document.getElementById('fototreino-status').textContent = 'Não foi possível enviar uma das fotos.';
      console.error(erroUpload);
      return;
    }
    const { data: urlData } = supabase.storage.from('fotos-treino').getPublicUrl(nomeArquivo);
    await supabase.from('fotos_treino').insert({ perfil_id: perfil.id, foto_url: urlData.publicUrl });
  }

  document.getElementById('fototreino-status').innerHTML =
    `${icon('check-circle', 16)} Foto(s) enviada(s)! O admin vai revisar e cadastrar seu treino em breve.`;
  mostrarModalSalvamento('Foto enviada!');
  setTimeout(() => criartreino_voltar(), 1200);
}

// ---------- MÉTODO: MD (texto corrido, sem limite) ----------
// (o botão de confirmar já vem do próprio uploadmd.js, que agora
// salva direto em criartreino_cicloIdCriado)

// ---------- MÉTODO: MANUAL (grupos → checklist) ----------

function criartreino_manualMostrarGrupos() {
  document.getElementById('criartreino-passo-manual-grupos').style.display = 'block';
  document.getElementById('criartreino-manual-contador').textContent =
    `${criartreino_contadorAdicionados} exercício(s) adicionado(s) até agora`;

  document.getElementById('criartreino-grupos-lista').innerHTML = GRUPOS_MUSCULARES.map(g => `
    <button class="card-menu-progresso" onclick="criartreino_abrirGrupo('${g.chave}')">
      <span class="card-menu-progresso-icone" style="background:var(--chama-pale, #FFE7E0);color:var(--chama-dark)">${icon('dumbbell', 20)}</span>
      <span>${g.label}</span>
    </button>
  `).join('');
}

async function criartreino_abrirGrupo(grupo) {
  criartreino_grupoAtual = grupo;
  const supabase = getSupabase();
  const { data } = await supabase.from('biblioteca_exercicios').select('*').eq('grupo_muscular', grupo).order('nome');

  document.getElementById('criartreino-passo-manual-grupos').style.display = 'none';
  document.getElementById('criartreino-passo-manual-checklist').style.display = 'block';
  document.getElementById('criartreino-checklist-titulo').textContent =
    GRUPOS_MUSCULARES.find(g => g.chave === grupo).label;

  document.getElementById('criartreino-checklist-itens').innerHTML = (data || []).map(e => `
    <label class="check-wrap">
      <input type="checkbox" value="${e.id}" data-nome="${e.nome.replace(/"/g, '&quot;')}">
      <span>${e.nome}</span>
    </label>
  `).join('') || '<p class="muted">Nenhum exercício cadastrado nesse grupo ainda.</p>';

  document.getElementById('criartreino-checklist-outro').value = '';
}

function criartreino_voltarAosGrupos() {
  document.getElementById('criartreino-passo-manual-checklist').style.display = 'none';
  criartreino_manualMostrarGrupos();
}

async function criartreino_confirmarChecklist() {
  const marcados = document.querySelectorAll('#criartreino-checklist-itens input[type="checkbox"]:checked');
  const outro = document.getElementById('criartreino-checklist-outro').value.trim();

  if (marcados.length === 0 && !outro) {
    alert('Marque ao menos um exercício ou escreva no campo "Outro".');
    return;
  }

  const supabase = getSupabase();
  const linhas = Array.from(marcados).map(chk => ({
    ciclo_id: criartreino_cicloIdCriado,
    letra_treino: 'A',
    biblioteca_exercicio_id: chk.value,
    nome: chk.dataset.nome,
    series_min: 2, series_max: 3, reps_min: 8, reps_max: 12, intervalo_segundos: 60,
  }));

  if (outro) {
    linhas.push({
      ciclo_id: criartreino_cicloIdCriado,
      letra_treino: 'A',
      nome: outro,
      series_min: 2, series_max: 3, reps_min: 8, reps_max: 12, intervalo_segundos: 60,
    });
  }

  const { error } = await supabase.from('exercicios').insert(linhas);
  if (error) {
    alert('Não foi possível adicionar os exercícios.');
    console.error(error);
    return;
  }

  criartreino_contadorAdicionados += linhas.length;
  document.getElementById('criartreino-passo-manual-checklist').style.display = 'none';
  criartreino_manualMostrarGrupos();
}

function criartreino_manualFinalizar() {
  mostrarModalSalvamento('Treino cadastrado!');
  setTimeout(() => criartreino_voltar(), 1000);
}
