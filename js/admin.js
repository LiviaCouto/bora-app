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
  if (aba === 'convites') onboarding_listarConvites();
  if (aba === 'feedbacks') admin_listarFeedbacks();
  if (aba === 'fotos') admin_listarFotosTreino();
}

// ---------- PERFIS ----------

async function admin_listarPerfis() {
  const supabase = getSupabase();
  const { data } = await supabase.from('perfis').select('*').order('criado_em');
  const container = document.getElementById('admin-lista-perfis');

  container.innerHTML = (data || []).map(p => `
    <div class="admin-item-linha">
      <div style="display:flex;align-items:center;gap:10px">
        ${avatares_img(p.avatar_id, 32)}
        <strong>${p.nome}</strong>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <select class="select-papel" onchange="admin_atualizarPapel('${p.id}', this.value)">
          <option value="usuario" ${p.papel === 'usuario' ? 'selected' : ''}>Usuário</option>
          <option value="admin" ${p.papel === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
        <button class="btn btn-danger btn-sm" onclick="admin_apagarPerfil('${p.id}', '${p.nome.replace(/'/g, "\\'")}')">Excluir</button>
      </div>
    </div>
  `).join('') || '<p class="muted">Nenhum perfil ainda.</p>';
}

async function admin_atualizarPapel(perfilId, novoPapel) {
  const supabase = getSupabase();
  const { error } = await supabase.from('perfis').update({ papel: novoPapel }).eq('id', perfilId);

  if (error) {
    alert('Não foi possível atualizar o papel desse perfil.');
    return;
  }

  // Se o admin mudou o próprio papel (raro, mas possível), atualiza a sessão local também
  if (AppState.perfilAtual && AppState.perfilAtual.id === perfilId) {
    AppState.perfilAtual.papel = novoPapel;
    salvarSessao(AppState.perfilAtual);
  }
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
      <div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="admin_gerenciarExercicios('${c.id}')">Editar exercícios</button>
        <button class="btn btn-danger btn-sm" onclick="admin_apagarCiclo('${c.id}')">Excluir</button>
      </div>
    </div>
  `).join('') || '<p class="muted">Nenhum ciclo cadastrado ainda.</p>';
}

async function admin_apagarCiclo(cicloId) {
  const confirmado = confirm('Excluir esse ciclo? Todos os exercícios, o histórico de check-in e o progresso vinculados a ele serão perdidos e não tem como desfazer.');
  if (!confirmado) return;

  const supabase = getSupabase();
  const { error } = await supabase.from('ciclos').delete().eq('id', cicloId);
  if (error) {
    alert('Não foi possível excluir o ciclo.');
    return;
  }
  admin_carregarCiclosDoPerfil();
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

// ---------- FEEDBACKS ----------

async function admin_listarFeedbacks() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('feedbacks')
    .select('*, perfis(nome)')
    .order('criado_em', { ascending: false });

  const rotuloCategoria = { bug: 'Bug', sugestao: 'Sugestão', elogio: 'Elogio' };

  document.getElementById('admin-lista-feedbacks').innerHTML = (data || []).map(f => `
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <span class="badge badge-neutral">${rotuloCategoria[f.categoria] || f.categoria}</span>
          <strong style="margin-left:6px">${f.perfis ? f.perfis.nome : 'Anônimo'}</strong>
          <div class="muted" style="font-size:11px">${formatarDataBR(f.criado_em ? f.criado_em.split('T')[0] : '')}</div>
        </div>
        <span class="badge ${f.status === 'resolvido' ? 'badge-success' : 'badge-sol'}">${f.status === 'resolvido' ? 'Resolvido' : 'Não resolvido'}</span>
      </div>
      <p style="margin-top:10px;font-size:13px">${f.texto}</p>
      <button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="admin_alternarStatusFeedback('${f.id}', '${f.status === 'resolvido' ? 'novo' : 'resolvido'}')">
        ${f.status === 'resolvido' ? 'Reabrir' : 'Marcar como resolvido'}
      </button>
    </div>
  `).join('') || '<p class="muted">Nenhum feedback recebido ainda.</p>';
}

async function admin_alternarStatusFeedback(id, novoStatus) {
  const supabase = getSupabase();
  const { error } = await supabase.from('feedbacks').update({ status: novoStatus }).eq('id', id);
  if (error) {
    alert('Não foi possível atualizar o status.');
    return;
  }
  admin_listarFeedbacks();
}

// ---------- Aviso em tempo real (só enquanto o app está aberto) ----------

let admin_canalTempoReal = null;

function admin_ativarAvisoTempoReal() {
  if (admin_canalTempoReal) return; // já está ativo, não duplica
  const supabase = getSupabase();

  admin_canalTempoReal = supabase
    .channel('novos-perfis')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'perfis' }, (payload) => {
      const perfilAtual = AppState.perfilAtual;
      if (perfilAtual && payload.new.id === perfilAtual.id) return; // não avisa sobre si mesmo
      mostrarToast('Novo membro no Bora!', `${payload.new.nome} acabou de criar o perfil.`);
    })
    .subscribe();

  supabase
    .channel('novas-fotos')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fotos_treino' }, async (payload) => {
      const { data: perfilDaFoto } = await supabase.from('perfis').select('nome').eq('id', payload.new.perfil_id).maybeSingle();
      mostrarToast('Nova foto de treino!', `${perfilDaFoto ? perfilDaFoto.nome : 'Alguém'} enviou uma foto pra você cadastrar.`);
      admin_atualizarBadgeFotos();
    })
    .subscribe();

  admin_atualizarBadgeFotos();
}

async function admin_atualizarBadgeFotos() {
  const supabase = getSupabase();
  const { count } = await supabase
    .from('fotos_treino')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente');

  const botao = document.querySelector('.admin-aba-botao[data-aba="fotos"]');
  if (!botao) return;

  let selo = botao.querySelector('.selo-contagem');
  if (count > 0) {
    if (!selo) {
      selo = document.createElement('span');
      selo.className = 'selo-contagem';
      botao.appendChild(selo);
    }
    selo.textContent = count;
  } else if (selo) {
    selo.remove();
  }
}

// ---------- Visão da família ----------

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
