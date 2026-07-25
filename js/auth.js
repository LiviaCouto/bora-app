// ============================================================
// BORA — Autenticação (seleção de perfil + PIN)
// ============================================================

let auth_perfilSelecionado = null;
let auth_pinDigitado = '';

async function render_auth() {
  const container = document.getElementById('auth-lista-perfis');
  container.innerHTML = '<p class="muted">Carregando perfis...</p>';

  const supabase = getSupabase();
  const { data, error } = await supabase.from('perfis').select('id, nome, avatar_id, papel').order('criado_em');

  if (error) {
    container.innerHTML = `<p class="erro-msg">Não foi possível carregar os perfis. Verifique a configuração do Supabase em js/config.js.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<p class="muted">Nenhum perfil cadastrado ainda. Peça ao admin da família pra criar o primeiro.</p>`;
    return;
  }

  container.innerHTML = data.map(p => `
    <button class="avatar-card" onclick="auth_selecionarPerfil('${p.id}', '${p.nome.replace(/'/g, "\\'")}')">
      ${avatares_img(p.avatar_id, 64)}
      <span>${p.nome}</span>
    </button>
  `).join('');
}

function auth_selecionarPerfil(id, nome) {
  auth_perfilSelecionado = { id, nome };
  auth_pinDigitado = '';
  document.getElementById('auth-nome-selecionado').textContent = nome;
  auth_atualizarPinVisual();
  document.getElementById('tela-selecao-perfil').style.display = 'none';
  document.getElementById('tela-pin').style.display = 'block';
}

function auth_voltarSelecao() {
  document.getElementById('tela-pin').style.display = 'none';
  document.getElementById('tela-selecao-perfil').style.display = 'block';
  document.getElementById('auth-erro').textContent = '';
}

function auth_digitarPin(numero) {
  if (auth_pinDigitado.length >= 4) return;
  auth_pinDigitado += String(numero);
  auth_atualizarPinVisual();
  if (auth_pinDigitado.length === 4) {
    setTimeout(auth_conferirPin, 150);
  }
}

function auth_apagarPin() {
  auth_pinDigitado = auth_pinDigitado.slice(0, -1);
  auth_atualizarPinVisual();
}

function auth_atualizarPinVisual() {
  const boxes = document.querySelectorAll('.pin-box');
  boxes.forEach((box, i) => {
    if (i < auth_pinDigitado.length) {
      box.textContent = '•';
      box.classList.add('filled');
    } else {
      box.textContent = '_';
      box.classList.remove('filled');
    }
  });
}

async function auth_conferirPin() {
  const erro = document.getElementById('auth-erro');
  erro.textContent = '';
  const supabase = getSupabase();
  const hash = await hashPin(auth_pinDigitado);

  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', auth_perfilSelecionado.id)
    .eq('pin_hash', hash)
    .maybeSingle();

  if (error || !data) {
    erro.textContent = 'PIN incorreto. Tente novamente.';
    auth_pinDigitado = '';
    auth_atualizarPinVisual();
    return;
  }

  salvarSessao(data);
  document.getElementById('tela-pin').style.display = 'none';
  irPara('home');
}
