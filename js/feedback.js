// ============================================================
// BORA — Feedback e Melhorias
// ============================================================

let feedback_categoriaSelecionada = 'sugestao';

function feedback_selecionarCategoria(cat) {
  feedback_categoriaSelecionada = cat;
  document.querySelectorAll('.chip-categoria').forEach(el => {
    el.classList.toggle('selecionada', el.dataset.categoria === cat);
  });
}

async function feedback_enviar() {
  const texto = document.getElementById('feedback-texto').value.trim();
  if (!texto) {
    alert('Escreve algo antes de enviar :)');
    return;
  }

  const supabase = getSupabase();
  const perfil = AppState.perfilAtual;

  const { error } = await supabase.from('feedbacks').insert({
    perfil_id: perfil ? perfil.id : null,
    categoria: feedback_categoriaSelecionada,
    texto,
  });

  if (error) {
    alert('Não foi possível enviar agora. Tenta de novo em instantes.');
    return;
  }

  document.getElementById('feedback-texto').value = '';
  document.getElementById('feedback-confirmacao').style.display = 'block';
  setTimeout(() => {
    document.getElementById('feedback-confirmacao').style.display = 'none';
  }, 3000);
}
