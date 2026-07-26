// ============================================================
// BORA — Revisão de fotos de treino pelo Admin
// (o envio da foto em si agora fica em criartreino.js)
// ============================================================

async function admin_listarFotosTreino() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('fotos_treino')
    .select('*, perfis(nome)')
    .order('criado_em', { ascending: false });

  document.getElementById('admin-lista-fotos').innerHTML = (data || []).map(f => `
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${f.perfis ? f.perfis.nome : 'Perfil'}</strong>
        <span class="badge ${f.status === 'processada' ? 'badge-success' : 'badge-sol'}">${f.status === 'processada' ? 'Processada' : 'Pendente'}</span>
      </div>
      <div class="muted" style="font-size:11px;margin-bottom:8px">${formatarDataBR(f.criado_em ? f.criado_em.split('T')[0] : '')}</div>
      <a href="${f.foto_url}" target="_blank"><img src="${f.foto_url}" style="width:100%;border-radius:10px"></a>
      ${f.status !== 'processada' ? `<button class="btn btn-outline btn-sm btn-full" style="margin-top:8px" onclick="admin_marcarFotoProcessada('${f.id}')">Marcar como processada</button>` : ''}
    </div>
  `).join('') || '<p class="muted">Nenhuma foto enviada ainda.</p>';
}

async function admin_marcarFotoProcessada(id) {
  const supabase = getSupabase();
  await supabase.from('fotos_treino').update({ status: 'processada' }).eq('id', id);
  admin_listarFotosTreino();
  admin_atualizarBadgeFotos();
}
