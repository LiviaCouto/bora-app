// ============================================================
// BORA — Check-in (escolha de atividade + registro)
// ============================================================

async function checkin_iniciar() {
  const supabase = getSupabase();
  const perfil = AppState.perfilAtual;

  const { data: tipos } = await supabase
    .from('tipos_atividade')
    .select('*')
    .or(`perfil_criador.is.null,perfil_criador.eq.${perfil.id}`)
    .order('nome');

  const lista = document.getElementById('checkin-lista-tipos');
  lista.innerHTML = (tipos || []).map(t => `
    <button class="chip-atividade" onclick="checkin_escolherTipo('${t.id}', '${t.nome.replace(/'/g, "\\'")}')">
      ${icon(t.icone || 'sparkles', 16)} ${t.nome}
    </button>
  `).join('') + `
    <button class="chip-atividade chip-nova" onclick="checkin_abrirNovaTag()">${icon('star', 16)} Criar tag</button>
  `;

  document.getElementById('modal-checkin').style.display = 'flex';
}

function checkin_fechar() {
  document.getElementById('modal-checkin').style.display = 'none';
  document.getElementById('checkin-form-livre').style.display = 'none';
  document.getElementById('checkin-lista-tipos').style.display = 'grid';
  checkin_pararCronometro(false);
}

let checkin_cronometroInterval = null;
let checkin_cronometroInicio = null;

function checkin_alternarCronometro() {
  if (checkin_cronometroInterval) {
    checkin_pararCronometro(true);
  } else {
    checkin_cronometroInicio = Date.now();
    document.getElementById('checkin-cronometro-botao').textContent = 'Parar cronômetro';
    checkin_cronometroInterval = setInterval(checkin_atualizarCronometro, 1000);
  }
}

function checkin_atualizarCronometro() {
  const segundos = Math.floor((Date.now() - checkin_cronometroInicio) / 1000);
  const min = String(Math.floor(segundos / 60)).padStart(2, '0');
  const seg = String(segundos % 60).padStart(2, '0');
  document.getElementById('checkin-cronometro-display').textContent = `${min}:${seg}`;
}

function checkin_pararCronometro(preencherDuracao) {
  if (checkin_cronometroInterval) {
    clearInterval(checkin_cronometroInterval);
    checkin_cronometroInterval = null;
    if (preencherDuracao && checkin_cronometroInicio) {
      const minutos = Math.round((Date.now() - checkin_cronometroInicio) / 60000);
      document.getElementById('checkin-duracao').value = minutos || 1;
    }
  }
  document.getElementById('checkin-cronometro-botao').textContent = 'Iniciar cronômetro';
  document.getElementById('checkin-cronometro-display').textContent = '00:00';
  checkin_cronometroInicio = null;
}

async function checkin_abrirNovaTag() {
  const nome = prompt('Nome da nova tag (ex: Escalada, Skate...):');
  if (!nome || !nome.trim()) return;

  const supabase = getSupabase();
  const perfil = AppState.perfilAtual;

  const { error } = await supabase.from('tipos_atividade').insert({
    nome: nome.trim(),
    icone: 'sparkles',
    perfil_criador: perfil.id,
  });

  if (error) {
    alert('Não foi possível criar a tag.');
    return;
  }

  checkin_iniciar(); // recarrega a lista já com a nova tag
}

let checkin_tipoSelecionadoId = null;
let checkin_tipoSelecionadoNome = null;

function checkin_escolherTipo(tipoId, tipoNome) {
  checkin_tipoSelecionadoId = tipoId;
  checkin_tipoSelecionadoNome = tipoNome;

  if (tipoNome === 'Musculação') {
    // Musculação abre o fluxo de treino de ficha (escolha A/B → execução guiada)
    checkin_fechar();
    irPara('treino');
    return;
  }

  // Qualquer outra tag = treino livre, registro simples
  document.getElementById('checkin-lista-tipos').style.display = 'none';
  document.getElementById('checkin-form-livre').style.display = 'block';
  document.getElementById('checkin-livre-titulo').textContent = tipoNome;
}

async function checkin_registrarLivre() {
  const supabase = getSupabase();
  const perfil = AppState.perfilAtual;
  const duracao = document.getElementById('checkin-duracao').value || null;
  const distancia = document.getElementById('checkin-distancia').value || null;
  const observacao = document.getElementById('checkin-observacao').value || null;

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      perfil_id: perfil.id,
      data: todayLocal(),
      tipo_atividade_id: checkin_tipoSelecionadoId,
    })
    .select()
    .single();

  if (error) {
    alert('Não foi possível registrar o check-in. Tenta de novo.');
    return;
  }

  if (duracao || distancia || observacao) {
    await supabase.from('atividades_livres').insert({
      checkin_id: checkin.id,
      duracao_minutos: duracao,
      distancia_km: distancia,
      observacao: observacao,
    });
  }

  await gamificacao_verificarBadges(perfil.id);
  checkin_fechar();
  await render_home();
  celebracao_disparar();
}

// Usado pelo fluxo de treino de ficha (musculação), ao concluir a execução guiada
async function checkin_finalizarTreino(cicloId, letraTreino, nivelCansaco, horaInicio, horaFim) {
  const supabase = getSupabase();
  const perfil = AppState.perfilAtual;

  const { data: tipoMusc } = await supabase
    .from('tipos_atividade')
    .select('id')
    .eq('nome', 'Musculação')
    .maybeSingle();

  const { error } = await supabase.from('checkins').insert({
    perfil_id: perfil.id,
    data: todayLocal(),
    tipo_atividade_id: tipoMusc ? tipoMusc.id : null,
    ciclo_id: cicloId,
    letra_treino: letraTreino,
    nivel_cansaco: nivelCansaco || null,
    hora_inicio: horaInicio || null,
    hora_fim: horaFim || null,
  });

  if (error) {
    alert('Não foi possível registrar o check-in de hoje (talvez já tenha feito).');
    return;
  }

  await gamificacao_verificarBadges(perfil.id);
}
