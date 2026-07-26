// ============================================================
// BORA — Home
// ============================================================

async function render_home() {
  const perfil = AppState.perfilAtual;
  if (!perfil) { irPara('auth'); return; }

  if (perfil.papel === 'admin') admin_ativarAvisoTempoReal();

  document.getElementById('home-saudacao').innerHTML =
    `<span style="display:inline-flex;align-items:center;gap:10px">${avatares_img(perfil.avatar_id, 40)} Oi, ${perfil.nome}!</span>`;

  const supabase = getSupabase();
  const hoje = todayLocal();

  const { data: checkinHoje } = await supabase
    .from('checkins')
    .select('*')
    .eq('perfil_id', perfil.id)
    .eq('data', hoje)
    .maybeSingle();

  const { data: dayOffHoje } = await supabase
    .from('dias_pausa')
    .select('*')
    .eq('perfil_id', perfil.id)
    .eq('data', hoje)
    .maybeSingle();

  const areaCard = document.getElementById('home-card-treino');
  const areaCheckin = document.getElementById('home-area-checkin');

  if (checkinHoje) {
    areaCard.innerHTML = `
      <div class="card-treino-home feito">
        ${icon('check-circle', 28)}
        <div>
          <div class="label-sol">Check-in de hoje</div>
          <div class="titulo-home">Já feito!</div>
        </div>
      </div>`;
    areaCheckin.innerHTML = '';
  } else if (dayOffHoje) {
    areaCard.innerHTML = `
      <div class="card-treino-home dayoff">
        ${icon('coffee', 28)}
        <div>
          <div class="label-sol">Hoje</div>
          <div class="titulo-home">Day off marcado</div>
        </div>
      </div>`;
    areaCheckin.innerHTML = `
      <button class="btn btn-outline btn-full" onclick="dayoff_removerHoje()">Marquei sem querer, remover</button>
    `;
  } else {
    areaCard.innerHTML = `
      <div class="card-treino-home">
        <div class="label-sol">Hoje</div>
        <div class="titulo-home">${frase_do_dia()}</div>
      </div>`;
    areaCheckin.innerHTML = `
      <button class="btn btn-primary btn-full" onclick="checkin_iniciar()">Fazer check-in</button>
    `;
  }

  await home_atualizarStreak(perfil.id);
  await home_listarCheckinsRecentes(perfil.id);
}

async function home_atualizarStreak(perfilId) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('checkins')
    .select('data')
    .eq('perfil_id', perfilId)
    .order('data', { ascending: false })
    .limit(400);

  const streak = calcularStreak(data || []);
  const totalCheckins = (data || []).length;
  const nivel = calcularNivel(totalCheckins);
  const nivelSeguinte = NIVEIS.find(n => n.min > totalCheckins);

  document.getElementById('home-streak-numero').textContent = streak;
  document.getElementById('home-streak-total').textContent =
    `${totalCheckins} check-ins no total`;
  document.getElementById('home-streak-nivel').textContent = nivel.nome;

  const barraEl = document.getElementById('home-streak-barra-preenchida');
  if (barraEl) {
    if (nivelSeguinte) {
      const progresso = Math.round(((totalCheckins - nivel.min) / (nivelSeguinte.min - nivel.min)) * 100);
      barraEl.style.width = `${progresso}%`;
    } else {
      barraEl.style.width = '100%';
    }
  }
}

function calcularStreak(linhasData) {
  if (!linhasData || linhasData.length === 0) return 0;
  const datas = linhasData.map(l => l.data).sort().reverse();
  let streak = 0;
  let cursor = todayLocal();

  for (const d of datas) {
    const diff = diferencaDias(cursor, d);
    if (diff === 0) {
      streak++;
      cursor = d;
    } else if (diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

async function home_listarCheckinsRecentes(perfilId) {
  const supabase = getSupabase();

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*, tipos_atividade(nome, icone)')
    .eq('perfil_id', perfilId)
    .order('data', { ascending: false })
    .limit(8);

  const { data: pausas } = await supabase
    .from('dias_pausa')
    .select('*')
    .eq('perfil_id', perfilId)
    .order('data', { ascending: false })
    .limit(8);

  const itens = [
    ...(checkins || []).map(c => ({
      tipo: 'checkin',
      data: c.data,
      nome: c.tipos_atividade ? c.tipos_atividade.nome : 'Treino',
      icone: c.tipos_atividade ? c.tipos_atividade.icone : 'dumbbell',
    })),
    ...(pausas || []).map(p => ({
      tipo: 'dayoff',
      data: p.data,
      nome: 'Day off',
      icone: 'coffee',
    })),
  ];

  itens.sort((a, b) => (a.data < b.data ? 1 : -1));

  const container = document.getElementById('home-lista-checkins');
  if (!container) return;

  container.innerHTML = itens.slice(0, 8).map(item => `
    <div class="item-historico ${item.tipo === 'dayoff' ? 'dayoff' : ''}">
      <span class="item-historico-icone">${icon(item.icone, 18)}</span>
      <span class="item-historico-nome">${item.nome}</span>
      <span class="item-historico-data muted">${formatarDataBR(item.data)}</span>
    </div>
  `).join('') || '<p class="muted">Nenhum check-in ainda — bora começar!</p>';
}
