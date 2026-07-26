// ============================================================
// BORA — Biblioteca de exercícios (escolher clicando, sem digitar)
// ============================================================

const GRUPOS_MUSCULARES = [
  { chave: 'peito', label: 'Peito' },
  { chave: 'costas', label: 'Costas' },
  { chave: 'ombro', label: 'Ombro' },
  { chave: 'biceps', label: 'Bíceps' },
  { chave: 'triceps', label: 'Tríceps' },
  { chave: 'perna', label: 'Perna' },
  { chave: 'abdomen', label: 'Abdômen' },
  { chave: 'cardio', label: 'Cardio' },
  { chave: 'funcional', label: 'Funcional' },
];

let biblioteca_callbackSelecao = null;
let biblioteca_grupoAtivo = 'peito';
let biblioteca_todosExercicios = [];

async function biblioteca_abrirSeletor(onSelecionar) {
  biblioteca_callbackSelecao = onSelecionar;
  document.getElementById('modal-biblioteca').style.display = 'flex';
  document.getElementById('biblioteca-busca').value = '';

  if (biblioteca_todosExercicios.length === 0) {
    const supabase = getSupabase();
    const { data } = await supabase.from('biblioteca_exercicios').select('*').order('nome');
    biblioteca_todosExercicios = data || [];
  }

  biblioteca_renderizarChips();
  biblioteca_selecionarGrupo(biblioteca_grupoAtivo);
}

function biblioteca_renderizarChips() {
  document.getElementById('biblioteca-chips').innerHTML = GRUPOS_MUSCULARES.map(g => `
    <button class="chip-atividade ${g.chave === biblioteca_grupoAtivo ? 'chip-atividade-ativa' : ''}" onclick="biblioteca_selecionarGrupo('${g.chave}')">${g.label}</button>
  `).join('');
}

function biblioteca_selecionarGrupo(grupo) {
  biblioteca_grupoAtivo = grupo;
  biblioteca_renderizarChips();
  const lista = biblioteca_todosExercicios.filter(e => e.grupo_muscular === grupo);
  biblioteca_renderizarLista(lista);
}

function biblioteca_filtrar() {
  const termo = document.getElementById('biblioteca-busca').value.trim().toLowerCase();
  if (!termo) {
    biblioteca_selecionarGrupo(biblioteca_grupoAtivo);
    return;
  }
  const lista = biblioteca_todosExercicios.filter(e => e.nome.toLowerCase().includes(termo));
  biblioteca_renderizarLista(lista);
}

function biblioteca_renderizarLista(lista) {
  document.getElementById('biblioteca-lista').innerHTML = lista.map(e => `
    <button class="item-checklist" onclick='biblioteca_escolher(${JSON.stringify(e.id)}, ${JSON.stringify(e.nome)})'>
      <span class="item-checklist-texto"><strong>${e.nome}</strong></span>
    </button>
  `).join('') || '<p class="muted">Nenhum exercício encontrado.</p>';
}

function biblioteca_escolher(id, nome) {
  document.getElementById('modal-biblioteca').style.display = 'none';
  if (biblioteca_callbackSelecao) biblioteca_callbackSelecao(id, nome);
}

function biblioteca_fecharSeletor() {
  document.getElementById('modal-biblioteca').style.display = 'none';
}
