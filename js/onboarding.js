// ============================================================
// BORA — Onboarding via convite
// Admin gera um link único (com o nome já definido); a pessoa abre
// o link, escolhe avatar, seleciona a relação e cria o próprio PIN
// (com confirmação e opção de visualizar).
// ============================================================

function onboarding_gerarToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function onboarding_criarConvite() {
  const nomeSugerido = document.getElementById('admin-convite-nome').value.trim();
  const email = document.getElementById('admin-convite-email').value.trim();

  if (!nomeSugerido) {
    alert('Escreva o nome da pessoa antes de gerar o convite.');
    return;
  }

  const supabase = getSupabase();
  const token = onboarding_gerarToken();

  const { error } = await supabase.from('convites').insert({
    nome_sugerido: nomeSugerido,
    email: email || null,
    token,
  });

  if (error) {
    alert('Não foi possível criar o convite.');
    return;
  }

  const link = `${window.location.origin}${window.location.pathname}?convite=${token}`;
  const mensagem = encodeURIComponent(`Oi ${nomeSugerido}! Entra no Bora (nosso app de treino) por esse link: ${link}`);

  document.getElementById('admin-convite-link-gerado').innerHTML = `
    <div class="admin-item-linha">
      <input class="input-demo" style="margin:0" readonly value="${link}" onclick="this.select()">
    </div>
    <div class="flex-wrap-botoes" style="margin-top:8px">
      <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${link}')">${icon('copy', 14)} Copiar link</button>
      <a class="btn btn-primary btn-sm" href="https://wa.me/?text=${mensagem}" target="_blank">${icon('message-square', 14)} Enviar por WhatsApp</a>
      <a class="btn btn-outline btn-sm" href="mailto:${email}?subject=Convite para o Bora&body=${mensagem}">${icon('mail', 14)} Abrir e-mail</a>
    </div>
  `;

  document.getElementById('admin-convite-nome').value = '';
  document.getElementById('admin-convite-email').value = '';
  onboarding_listarConvites();
}

async function onboarding_listarConvites() {
  const supabase = getSupabase();
  const { data } = await supabase.from('convites').select('*').order('criado_em', { ascending: false });

  const container = document.getElementById('admin-lista-convites');
  if (!container) return;

  container.innerHTML = (data || []).map(c => `
    <div class="admin-item-linha">
      <div>${c.nome_sugerido || c.email || 'Convite sem nome'}<div class="muted">${c.criado_em ? formatarDataBR(c.criado_em.split('T')[0]) : ''}</div></div>
      <span class="badge ${c.usado ? 'badge-success' : 'badge-neutral'}">${c.usado ? 'Aceito' : 'Pendente'}</span>
    </div>
  `).join('') || '<p class="muted">Nenhum convite gerado ainda.</p>';
}

// ---------- Tela de aceite do convite ----------

let onboarding_conviteAtual = null;
let onboarding_avatarEscolhido = 'coelha-halteres';

async function onboarding_verificarConviteNaURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('convite');
  if (!token) return false;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('convites')
    .select('*')
    .eq('token', token)
    .eq('usado', false)
    .maybeSingle();

  if (error || !data) {
    alert('Esse link de convite não é válido ou já foi usado.');
    return false;
  }

  if (new Date(data.expira_em) < new Date()) {
    alert('Esse link de convite expirou. Peça um novo ao admin da família.');
    return false;
  }

  onboarding_conviteAtual = data;
  irPara('onboarding');
  return true;
}

function render_onboarding() {
  onboarding_avatarEscolhido = 'coelha-halteres';
  document.getElementById('onboarding-avatar-preview').src = 'icons/avatars/coelha-halteres.png';
  document.getElementById('onboarding-titulo-nome').textContent = `Bem-vindo(a), ${onboarding_conviteAtual.nome_sugerido}!`;
  document.getElementById('onboarding-relacao').value = '';
  document.getElementById('onboarding-pin').value = '';
  document.getElementById('onboarding-pin-confirmar').value = '';
  document.getElementById('onboarding-erro-pin').style.display = 'none';
  document.getElementById('onboarding-btn-criar').disabled = true;
}

function onboarding_escolherAvatar() {
  avatares_abrirSeletor((avatarId) => {
    onboarding_avatarEscolhido = avatarId;
    document.getElementById('onboarding-avatar-preview').src = `icons/avatars/${avatarId}.png`;
  });
}

function onboarding_alternarVisibilidadePin(inputId, botao) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
}

function onboarding_validarFormulario() {
  const relacao = document.getElementById('onboarding-relacao').value;
  const pin = document.getElementById('onboarding-pin').value;
  const pinConfirmar = document.getElementById('onboarding-pin-confirmar').value;
  const erroEl = document.getElementById('onboarding-erro-pin');
  const btn = document.getElementById('onboarding-btn-criar');

  const pinsPreenchidos = pin.length === 4 && pinConfirmar.length === 4;
  const pinsIguais = pin === pinConfirmar;

  erroEl.style.display = (pinsPreenchidos && !pinsIguais) ? 'block' : 'none';

  const tudoValido = relacao && pinsPreenchidos && pinsIguais;
  btn.disabled = !tudoValido;
}

async function onboarding_finalizar() {
  const nome = onboarding_conviteAtual.nome_sugerido;
  const relacao = document.getElementById('onboarding-relacao').value;
  const pin = document.getElementById('onboarding-pin').value;

  const supabase = getSupabase();
  const pin_hash = await hashPin(pin);

  const { data: perfil, error } = await supabase.from('perfis').insert({
    nome,
    pin_hash,
    relacao,
    avatar_id: onboarding_avatarEscolhido,
    email: onboarding_conviteAtual.email,
    papel: 'usuario',
  }).select().single();

  if (error) {
    alert('Não foi possível criar seu perfil.');
    console.error(error);
    return;
  }

  await supabase.from('convites').update({ usado: true }).eq('id', onboarding_conviteAtual.id);

  salvarSessao(perfil);
  window.history.replaceState({}, '', window.location.pathname);
  irPara('home');
}
