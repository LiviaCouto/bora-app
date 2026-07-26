// ============================================================
// BORA — Meu Perfil (editar nome, idade, objetivos, avatar, medidas)
// ============================================================

const OBJETIVOS_TREINO = [
  { valor: 'hipertrofia', label: 'Hipertrofia (ganho de massa)' },
  { valor: 'emagrecimento', label: 'Emagrecimento' },
  { valor: 'condicionamento', label: 'Condicionamento físico' },
  { valor: 'bem_estar', label: 'Bem-estar e saúde geral' },
  { valor: 'reabilitacao', label: 'Reabilitação/fisioterapia' },
  { valor: 'performance', label: 'Performance esportiva' },
  { valor: 'outro', label: 'Outro' },
];

let meuperfil_avatarEscolhido = null;

function render_meuperfil() {
  const perfil = AppState.perfilAtual;

  meuperfil_avatarEscolhido = perfil.avatar_id;
  document.getElementById('meuperfil-avatar-preview').src = perfil.avatar_id
    ? `icons/avatars/${perfil.avatar_id}.png`
    : 'icons/logo-bora-simbolo.png';

  document.getElementById('meuperfil-nome').value = perfil.nome || '';
  document.getElementById('meuperfil-idade').value = perfil.idade || '';

  const objetivosAtuais = (perfil.objetivo || '').split(',').map(s => s.trim()).filter(Boolean);
  document.getElementById('meuperfil-objetivos-checkboxes').innerHTML = OBJETIVOS_TREINO.map(o => `
    <label class="check-wrap">
      <input type="checkbox" value="${o.valor}" ${objetivosAtuais.includes(o.valor) ? 'checked' : ''}>
      <span>${o.label}</span>
    </label>
  `).join('');

  medidas_carregarTudo();
}

function meuperfil_escolherAvatar() {
  avatares_abrirSeletor((avatarId) => {
    meuperfil_avatarEscolhido = avatarId;
    document.getElementById('meuperfil-avatar-preview').src = `icons/avatars/${avatarId}.png`;
  });
}

async function meuperfil_salvar() {
  const perfil = AppState.perfilAtual;
  const nome = document.getElementById('meuperfil-nome').value.trim();
  const idade = document.getElementById('meuperfil-idade').value || null;

  const checkboxes = document.querySelectorAll('#meuperfil-objetivos-checkboxes input[type="checkbox"]:checked');
  const objetivo = Array.from(checkboxes).map(c => c.value).join(',') || null;

  if (!nome) {
    alert('O nome não pode ficar vazio.');
    return;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('perfis')
    .update({
      nome,
      idade,
      objetivo,
      avatar_id: meuperfil_avatarEscolhido,
    })
    .eq('id', perfil.id)
    .select()
    .single();

  if (error) {
    alert('Não foi possível salvar suas alterações.');
    console.error(error);
    return;
  }

  salvarSessao(data);
  await gamificacao_verificarBadges(perfil.id);
  mostrarModalSalvamento('Perfil atualizado!');
}
