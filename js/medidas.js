// ============================================================
// BORA — Medidas corporais (agora dentro de Meu Perfil)
// Privado — só o próprio perfil e o admin veem.
// ============================================================

let medidas_chart = null;

async function medidas_carregarTudo() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data } = await supabase
    .from('medidas_corporais')
    .select('*')
    .eq('perfil_id', perfil.id)
    .order('data', { ascending: true });

  medidas_renderizarHistorico(data || []);
  medidas_renderizarGrafico(data || []);
}

function medidas_renderizarHistorico(lista) {
  document.getElementById('medidas-historico').innerHTML = [...lista].reverse().map(m => `
    <div class="admin-item-linha">
      <div>${formatarDataBR(m.data)}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="muted">
          ${m.peso_kg ? `${m.peso_kg}kg` : ''}
          ${m.cintura_cm ? ` · cintura ${m.cintura_cm}cm` : ''}
          ${m.braco_cm ? ` · braço ${m.braco_cm}cm` : ''}
        </span>
        <button class="btn btn-danger btn-sm" onclick="medidas_apagar('${m.id}')">Excluir</button>
      </div>
    </div>
  `).join('') || '<p class="muted">Nenhuma medida registrada ainda.</p>';
}

function medidas_renderizarGrafico(lista) {
  const canvas = document.getElementById('medidas-grafico');
  if (!canvas || typeof Chart === 'undefined') return;

  const comPeso = lista.filter(m => m.peso_kg);
  if (comPeso.length < 2) {
    canvas.parentElement.innerHTML = '<div class="muted">Registre pelo menos 2 medidas de peso pra ver o gráfico de evolução.</div>';
    return;
  }

  if (medidas_chart) medidas_chart.destroy();

  medidas_chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: comPeso.map(m => formatarDataBR(m.data)),
      datasets: [{
        label: 'Peso (kg)',
        data: comPeso.map(m => m.peso_kg),
        borderColor: '#FF5A3C',
        backgroundColor: '#FF5A3C',
        tension: 0.3,
      }],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}

async function medidas_registrar() {
  const perfil = AppState.perfilAtual;
  const peso = document.getElementById('medidas-peso').value || null;
  const cintura = document.getElementById('medidas-cintura').value || null;
  const braco = document.getElementById('medidas-braco').value || null;
  const obs = document.getElementById('medidas-obs').value || null;

  if (!peso && !cintura && !braco) {
    alert('Preencha ao menos uma medida.');
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('medidas_corporais').insert({
    perfil_id: perfil.id,
    peso_kg: peso,
    cintura_cm: cintura,
    braco_cm: braco,
    observacao: obs,
  });

  if (error) {
    alert('Não foi possível salvar.');
    return;
  }

  document.getElementById('medidas-peso').value = '';
  document.getElementById('medidas-cintura').value = '';
  document.getElementById('medidas-braco').value = '';
  document.getElementById('medidas-obs').value = '';
  medidas_carregarTudo();
  mostrarModalSalvamento('Medida registrada!');
}

async function medidas_apagar(id) {
  const confirmado = confirm('Excluir esse registro de medida? Não tem como desfazer.');
  if (!confirmado) return;

  const supabase = getSupabase();
  await supabase.from('medidas_corporais').delete().eq('id', id);
  medidas_carregarTudo();
}
