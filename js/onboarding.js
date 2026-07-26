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
  const nomeAdmin = AppState.perfilAtual ? AppState.perfilAtual.nome : 'a família';
  const mensagem = `${nomeAdmin} te chamou pro Bora! Um app da nossa família pra treinar juntos, sem papel e com mais motivação. Toca aqui e cria seu perfil: ${link}`;
  const mensagemCodificada = encodeURIComponent(mensagem);

  document.getElementById('admin-convite-link-gerado').innerHTML = `
    <div class="admin-item-linha">
      <input class="input-demo" style="margin:0" readonly value="${link}" onclick="this.select()">
    </div>
    <div class="flex-wrap-botoes" style="margin-top:8px">
      <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(mensagem)});this.textContent='Copiado!'">${icon('copy', 14)} Copiar mensagem pronta</button>
      <a class="btn btn-outline btn-sm" href="https://wa.me/?text=${mensagemCodificada}" target="_blank">${icon('message-square', 14)} Abrir WhatsApp</a>
      <a class="btn btn-outline btn-sm" href="mailto:${email}?subject=Convite para o Bora&body=${mensagemCodificada}">${icon('mail', 14)} Abrir e-mail</a>
    </div>
    <p class="muted" style="font-size:11px;margin-top:8px">Dica: cole a mensagem no WhatsApp e anexe a logo do Bora como foto, se quiser deixar mais bonito.</p>
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
      <div style="display:flex;gap:6px;align-items:center">
        <span class="badge ${c.usado ? 'badge-success' : 'badge-neutral'}">${c.usado ? 'Aceito' : 'Pendente'}</span>
        ${!c.usado ? `
          <button class="btn btn-outline btn-sm" onclick='onboarding_verConvite(${JSON.stringify(c)})'>Ver</button>
          <button class="btn btn-outline btn-sm" onclick="onboarding_editarConvite('${c.id}', ${JSON.stringify(c.nome_sugerido || '')}, ${JSON.stringify(c.email || '')})">Editar</button>
        ` : ''}
        <button class="btn btn-danger btn-sm" onclick="onboarding_excluirConvite('${c.id}')">Excluir</button>
      </div>
    </div>
  `).join('') || '<p class="muted">Nenhum convite gerado ainda.</p>';
}

function onboarding_verConvite(convite) {
  const link = `${window.location.origin}${window.location.pathname}?convite=${convite.token}`;
  const nomeAdmin = AppState.perfilAtual ? AppState.perfilAtual.nome : 'a família';
  const mensagem = `${nomeAdmin} te chamou pro Bora! Um app da nossa família pra treinar juntos, sem papel e com mais motivação. Toca aqui e cria seu perfil: ${link}`;

  document.getElementById('admin-convite-link-gerado').innerHTML = `
    <div class="admin-item-linha">
      <input class="input-demo" style="margin:0" readonly value="${link}" onclick="this.select()">
    </div>
    <div class="flex-wrap-botoes" style="margin-top:8px">
      <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(mensagem)});this.textContent='Copiado!'">${icon('copy', 14)} Copiar mensagem pronta</button>
      <a class="btn btn-outline btn-sm" href="https://wa.me/?text=${encodeURIComponent(mensagem)}" target="_blank">${icon('message-square', 14)} Abrir WhatsApp</a>
    </div>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function onboarding_editarConvite(id, nomeAtual, emailAtual) {
  const novoNome = prompt('Nome sugerido:', nomeAtual);
  if (novoNome === null) return;
  const novoEmail = prompt('E-mail (opcional):', emailAtual);

  const supabase = getSupabase();
  const { error } = await supabase.from('convites').update({
    nome_sugerido: novoNome.trim(),
    email: novoEmail ? novoEmail.trim() : null,
  }).eq('id', id);

  if (error) {
    alert('Não foi possível editar o convite.');
    return;
  }
  onboarding_listarConvites();
}

async function onboarding_excluirConvite(id) {
  const confirmado = confirm('Excluir esse convite? Se a pessoa ainda não usou o link, ele para de funcionar.');
  if (!confirmado) return;

  const supabase = getSupabase();
  await supabase.from('convites').delete().eq('id', id);
  onboarding_listarConvites();
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
    .maybeSingle();

  if (error || !data) {
    irPara('conviteinvalido');
    document.getElementById('conviteinvalido-texto').textContent =
      'Esse link de convite não existe (talvez tenha sido excluído). Peça um novo ao admin da família.';
    return true;
  }

  if (data.usado) {
    irPara('conviteinvalido');
    document.getElementById('conviteinvalido-texto').textContent =
      'Esse convite já foi usado. Peça um novo ao admin da família.';
    return true;
  }

  if (new Date(data.expira_em) < new Date()) {
    irPara('conviteinvalido');
    document.getElementById('conviteinvalido-texto').textContent =
      'Esse link de convite expirou. Peça um novo ao admin da família.';
    return true;
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

function onboarding_alternarVisibilidadePin(inputId, botaoId) {
  const input = document.getElementById(inputId);
  const botao = document.getElementById(botaoId);
  const oculto = input.type === 'password';
  input.type = oculto ? 'text' : 'password';
  botao.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${oculto ? ICONS['eye'] : ICONS['eye-off']}</svg>`;
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

  document.getElementById('boasvindas-titulo').textContent = `Bem-vindo(a), ${nome}!`;
  onboarding_dispararConfete();
  document.getElementById('modal-boasvindas').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('modal-boasvindas').style.display = 'none';
    irPara('meutreino');
  }, 2400);
}

function onboarding_dispararConfete() {
  const container = document.getElementById('confete-container');
  const cores = ['#FF5A3C', '#FFC93C', '#E63977', '#2FA84F', '#0E4F4A'];
  container.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.className = 'confete-item';
    el.style.left = Math.random() * 100 + '%';
    el.style.background = cores[i % cores.length];
    el.style.animationDelay = (Math.random() * 0.4) + 's';
    container.appendChild(el);
  }
}
