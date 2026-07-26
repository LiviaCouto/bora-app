// ============================================================
// BORA — Integração YouTube Data API v3
// Busca automática de vídeo demonstrativo, mas SEMPRE com
// confirmação de 1 clique antes de vincular ao exercício (Opção A).
// Vincula direto na tabela `exercicios` — funciona pra qualquer
// exercício, inclusive os importados por colar texto.
// ============================================================

let youtube_exercicioAlvoId = null;
let youtube_exercicioAlvoNome = null;

async function youtube_buscarParaExercicio(exercicioId, nomeExercicio) {
  if (!CONFIG.YOUTUBE_API_KEY || CONFIG.YOUTUBE_API_KEY.includes('SUA_')) {
    alert('A chave da API do YouTube ainda não foi configurada em js/config.js.');
    return;
  }

  youtube_exercicioAlvoId = exercicioId;
  youtube_exercicioAlvoNome = nomeExercicio;

  const query = encodeURIComponent(`${nomeExercicio} execução técnica academia`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${query}&key=${CONFIG.YOUTUBE_API_KEY}`;

  document.getElementById('modal-youtube').style.display = 'flex';
  document.getElementById('youtube-resultados').innerHTML = '<p class="muted">Buscando vídeos...</p>';

  try {
    const resp = await fetch(url);
    const dados = await resp.json();

    if (!dados.items || dados.items.length === 0) {
      document.getElementById('youtube-resultados').innerHTML = '<p class="muted">Nenhum vídeo encontrado.</p>';
      return;
    }

    document.getElementById('youtube-resultados').innerHTML = dados.items.map(item => `
      <div class="admin-item-linha" style="align-items:flex-start">
        <div style="display:flex;gap:10px">
          <img src="${item.snippet.thumbnails.default.url}" style="border-radius:8px">
          <div style="font-size:12px">${item.snippet.title}<br><span class="muted">${item.snippet.channelTitle}</span></div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="youtube_confirmar('${item.id.videoId}')">Usar esse</button>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('youtube-resultados').innerHTML = '<p class="erro-msg">Erro ao buscar. Confira a chave da API.</p>';
    console.error(e);
  }
}

async function youtube_confirmar(videoId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('exercicios')
    .update({ video_id: videoId })
    .eq('id', youtube_exercicioAlvoId);

  if (error) {
    alert('Não foi possível vincular o vídeo.');
    return;
  }

  document.getElementById('modal-youtube').style.display = 'none';

  // Atualiza o exercício em memória e re-renderiza a tela de execução, se for o caso
  const ex = treino_listaExercicios.find(e => e.id === youtube_exercicioAlvoId);
  if (ex) ex.video_id = videoId;
  if (document.getElementById('secao-execucao').style.display !== 'none') {
    execucao_renderizarExercicioAtual();
  }
}

function youtube_fechar() {
  document.getElementById('modal-youtube').style.display = 'none';
}
