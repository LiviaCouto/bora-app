// ============================================================
// BORA — Foto do treino em papel (sem OCR — fica pendente pro
// admin revisar e transcrever manualmente)
// ============================================================

async function fototreino_enviar() {
  const input = document.getElementById('fototreino-input');
  const arquivo = input.files[0];
  if (!arquivo) {
    alert('Escolha uma foto primeiro.');
    return;
  }

  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();
  const nomeArquivo = `${perfil.id}-${Date.now()}.jpg`;

  document.getElementById('fototreino-status').textContent = 'Enviando...';

  const { error: erroUpload } = await supabase.storage
    .from('fotos-treino')
    .upload(nomeArquivo, arquivo);

  if (erroUpload) {
    document.getElementById('fototreino-status').textContent = 'Não foi possível enviar. Tenta de novo.';
    console.error(erroUpload);
    return;
  }

  const { data: urlData } = supabase.storage.from('fotos-treino').getPublicUrl(nomeArquivo);

  const { error: erroInsert } = await supabase.from('fotos_treino').insert({
    perfil_id: perfil.id,
    foto_url: urlData.publicUrl,
  });

  if (erroInsert) {
    document.getElementById('fototreino-status').textContent = 'Foto enviada, mas houve um erro ao registrar.';
    return;
  }

  document.getElementById('fototreino-status').innerHTML =
    `${icon('check-circle', 16)} Foto enviada! O admin vai revisar e cadastrar seu treino em breve.`;
  input.value = '';
}

// ---------- Revisão pelo Admin ----------

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
