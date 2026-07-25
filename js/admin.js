// ============================================================
// BORA — Admin (perfis, ciclos/exercícios, visão da família)
// Só visível pra perfis com papel = 'admin'.
// ============================================================

async function render_admin() {
  const perfil = AppState.perfilAtual;
  if (!perfil || perfil.papel !== 'admin') {
    document.getElementById('secao-admin').innerHTML =
      '<p class="muted" style="padding:24px">Essa área é só pro admin da família.</p>';
    return;
  }
  admin_abrirAba('perfis');
}

function admin_abrirAba(aba) {
  document.querySelectorAll('.admin-aba-conteudo').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.admin-aba-botao').forEach(el => el.classList.remove('active'));
  document.getElementById('admin-aba-' + aba).style.display = 'block';
  document.querySelector(`.admin-aba-botao[data-aba="${aba}"]`).classList.add('active');

  if (aba === 'perfis') admin_listarPerfis();
  if (aba === 'treinos') admin_listarPerfisParaCiclo();
  if (aba === 'familia') admin_visaoFamilia();
}

// ---------- PERFIS ----------

async function admin_listarPerfis() {
  const supabase = getSupabase();
  const { data } = await supabase.from('perfis').select('*').order('criado_em');
  const container = document.getElementById('admin-lista-perfis');

  container.innerHTML = (data || []).map(p => `
    <div class="admin-item-linha">
      <div style="display:flex;align-items:center;gap:10px">${avatares_img(p.avatar_id, 32)}<strong>${p.nome}</strong> <span class="badge badge-neutral">${p.papel}</span></div>
      <button class="btn btn-danger btn-sm" onclick="admin_apagarPerfil('${p.id}', '${p.nome.replace(/'/g, "\\'")}')">Excluir</button>
    </div>
  `).join('') || '<p class="muted">Nenhum perfil ainda.</p>';
}

async function admin_criarPerfil() {
  const nome = document.getElementById('admin-novo-perfil-nome').value.trim();
  const pin = document.getElementById('admin-novo-perfil-pin').value.trim();
  const relacao = document.getElementById('admin-novo-perfil-relacao').value.trim();
  const papel = document.getElementById('admin-novo-perfil-papel').value;
  const avatarId = document.getElementById('admin-novo-perfil-avatar-valor').value || 'chama-classica';

  if (!nome || pin.length !== 4) {
    alert('Preencha o nome e um PIN de 4 dígitos.');
    return;
  }

  const supabase = getSupabase();
  const pin_hash = await hashPin(pin);

  const { error } = await supabase.from('perfis').insert({ nome, pin_hash, relacao, papel, avatar_id: avatarId });
  if (error) {
    alert('Não foi possível criar o perfil.');
    console.error(error);
    return;
  }

  document.getElementById('admin-novo-perfil-nome').value = '';
  document.getElementById('admin-novo-perfil-pin').value = '';
  document.getElementById('admin-novo-perfil-avatar-valor').value = 'chama-classica';
  document.getElementById('admin-novo-perfil-avatar-preview').src = 'icons/avatars/chama-classica.png';
  admin_listarPerfis();
}

function admin_escolherAvatarNovoPerfil() {
  avatares_abrirSeletor((avatarId) => {
    document.getElementById('admin-novo-perfil-avatar-valor').value = avatarId;
    document.getElementById('admin-novo-perfil-avatar-preview').src = `icons/avatars/${avatarId}.png`;
  });
}

async function admin_apagarPerfil(id, nome) {
  const confirmado = confirm(`Apagar o perfil de ${nome}? Todo o histórico (treinos, check-ins, progresso) vai junto e não tem como desfazer.`);
  if (!confirmado) return;

  const supabase = getSupabase();
  const { error } = await supabase.from('perfis').delete().eq('id', id);
  if (error) {
    alert('Não foi possível apagar o perfil.');
    return;
  }
  admin_listarPerfis();
}

// ---------- CICLOS / EXERCÍCIOS ----------

async function admin_listarPerfisParaCiclo() {
  const supabase = getSupabase();
  const { data } = await supabase.from('perfis').select('id, nome').order('nome');
  const select = document.getElementById('admin-select-perfil-ciclo');
  select.innerHTML = (data || []).map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
  if (data && data.length) admin_carregarCiclosDoPerfil();
}

async function admin_carregarCiclosDoPerfil() {
  const perfilId = document.getElementById('admin-select-perfil-ciclo').value;
  const supabase = getSupabase();
  const { data } = await supabase
    .from('ciclos')
    .select('*')
    .eq('perfil_id', perfilId)
    .order('data_inicio', { ascending: false });

  const container = document.getElementById('admin-lista-ciclos');
  container.innerHTML = (data || []).map(c => `
    <div class="admin-item-linha">
      <div>Ciclo desde ${formatarDataBR(c.data_inicio)} <span class="badge ${c.status === 'ativo' ? 'badge-success' : 'badge-neutral'}">${c.status}</span></div>
      <button class="btn btn-outline btn-sm" onclick="admin_gerenciarExercicios('${c.id}')">Gerenciar exercícios</button>
    </div>
  `).join('') || '<p class="muted">Nenhum ciclo cadastrado ainda.</p>';
}

async function admin_criarCiclo() {
  const perfilId = document.getElementById('admin-select-perfil-ciclo').value;
  const responsavel = document.getElementById('admin-ciclo-responsavel').value.trim();
  const cref = document.getElementById('admin-ciclo-cref').value.trim();

  const supabase = getSupabase();
  const { error } = await supabase.from('ciclos').insert({
    perfil_id: perfilId,
    data_inicio: todayLocal(),
    responsavel_nome: responsavel || null,
    responsavel_cref: cref || null,
  });

  if (error) {
    alert('Não foi possível criar o ciclo.');
    return;
  }
  admin_carregarCiclosDoPerfil();
}

let admin_cicloEmEdicao = null;

async function admin_gerenciarExercicios(cicloId) {
  admin_cicloEmEdicao = cicloId;
  document.getElementById('admin-painel-exercicios').style.display = 'block';
  await admin_listarExercicios();
}

async function admin_listarExercicios() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('exercicios')
    .select('*')
    .eq('ciclo_id', admin_cicloEmEdicao)
    .order('letra_treino')
    .order('ordem');

  const container = document.getElementById('admin-lista-exercicios');
  container.innerHTML = (data || []).map(e => `
    <div class="admin-item-linha">
      <div><strong>Treino ${e.letra_treino}</strong> — ${e.nome} (${e.series_min}-${e.series_max} séries × ${e.reps_min}-${e.reps_max} reps)</div>
      <button class="btn btn-danger btn-sm" onclick="admin_apagarExercicio('${e.id}')">Excluir</button>
    </div>
  `).join('') || '<p class="muted">Nenhum exercício cadastrado neste ciclo ainda.</p>';
}

async function admin_adicionarExercicio() {
  const letra = document.getElementById('admin-ex-letra').value.trim().toUpperCase();
  const nome = document.getElementById('admin-ex-nome').value.trim();
  const numeroMaquina = document.getElementById('admin-ex-maquina').value.trim();
  const seriesMin = parseInt(document.getElementById('admin-ex-series-min').value) || 2;
  const seriesMax = parseInt(document.getElementById('admin-ex-series-max').value) || 3;
  const repsMin = parseInt(document.getElementById('admin-ex-reps-min').value) || 8;
  const repsMax = parseInt(document.getElementById('admin-ex-reps-max').value) || 12;
  const intervalo = parseInt(document.getElementById('admin-ex-intervalo').value) || 60;

  if (!letra || !nome) {
    alert('Preencha ao menos a letra do treino e o nome do exercício.');
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('exercicios').insert({
    ciclo_id: admin_cicloEmEdicao,
    letra_treino: letra,
    nome,
    numero_maquina: numeroMaquina || null,
    series_min: seriesMin,
    series_max: seriesMax,
    reps_min: repsMin,
    reps_max: repsMax,
    intervalo_segundos: intervalo,
  });

  if (error) {
    alert('Não foi possível adicionar o exercício.');
    return;
  }

  document.getElementById('admin-ex-nome').value = '';
  document.getElementById('admin-ex-maquina').value = '';
  admin_listarExercicios();
}

async function admin_apagarExercicio(id) {
  const supabase = getSupabase();
  await supabase.from('exercicios').delete().eq('id', id);
  admin_listarExercicios();
}

// ---------- VISÃO DA FAMÍLIA ----------

async function admin_visaoFamilia() {
  const supabase = getSupabase();
  const hoje = todayLocal();

  const { data: perfis } = await supabase.from('perfis').select('id, nome');
  const { data: checkinsHoje } = await supabase.from('checkins').select('perfil_id').eq('data', hoje);
  const feitos = new Set((checkinsHoje || []).map(c => c.perfil_id));

  const linhas = await Promise.all((perfis || []).map(async p => {
    const { count } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('perfil_id', p.id);
    return `
      <div class="admin-item-linha">
        <div><strong>${p.nome}</strong> — ${count || 0} check-ins no total</div>
        <span class="badge ${feitos.has(p.id) ? 'badge-success' : 'badge-neutral'}">
          ${feitos.has(p.id) ? 'Check-in feito hoje' : 'Ainda não hoje'}
        </span>
      </div>`;
  }));

  document.getElementById('admin-lista-familia').innerHTML = linhas.join('') || '<p class="muted">Nenhum perfil cadastrado.</p>';
}
