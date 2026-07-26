// ============================================================
// BORA — Home
// ============================================================

async function render_home() {
  const perfil = AppState.perfilAtual;
  if (!perfil) { irPara('auth'); return; }

  if (perfil.papel === 'admin') admin_ativarAvisoTempoReal();

  document.getElementById('home-saudacao').textContent = `Oi, ${perfil.nome}!`;

  const supabase = getSupabase();
  const hoje = todayLocal();

  // Check-in de hoje já feito?
  const { data: checkinHoje } = await supabase
    .from('checkins')
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
          <div class="titulo-home">Já feito! 🔥</div>
        </div>
      </div>`;
    areaCheckin.innerHTML = '';
  } else {
    areaCard.innerHTML = `
      <div class="card-treino-home">
        <div class="label-sol">Hoje</div>
        <div class="titulo-home">O que você vai fazer?</div>
      </div>`;
    areaCheckin.innerHTML = `
      <button class="btn btn-primary btn-full" onclick="checkin_iniciar()">Fazer check-in</button>
    `;
  }

  await home_atualizarStreak(perfil.id);
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

  document.getElementById('home-streak-numero').textContent = streak;
  document.getElementById('home-streak-total').textContent =
    `${totalCheckins} check-ins no total · Nível ${nivel.nome}`;
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
