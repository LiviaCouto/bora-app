// ============================================================
// BORA — Captura de leads (landing) — "Peça seu acesso aqui"
// ============================================================

function lead_abrirModal() {
  document.getElementById('lead-nome').value = '';
  document.getElementById('lead-whatsapp').value = '';
  document.getElementById('lead-email').value = '';
  document.getElementById('modal-lead').style.display = 'flex';
}

function lead_fecharModal() {
  document.getElementById('modal-lead').style.display = 'none';
}

async function lead_enviar() {
  const nome = document.getElementById('lead-nome').value.trim();
  const whatsapp = document.getElementById('lead-whatsapp').value.trim();
  const email = document.getElementById('lead-email').value.trim();

  if (!nome || !whatsapp) {
    alert('Nome e WhatsApp são obrigatórios.');
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('leads').insert({
    nome,
    whatsapp,
    email: email || null,
  });

  if (error) {
    alert('Não foi possível enviar. Tenta de novo em instantes.');
    return;
  }

  lead_fecharModal();
  document.getElementById('modal-lead-confirmacao').style.display = 'flex';
}

function lead_fecharConfirmacao() {
  document.getElementById('modal-lead-confirmacao').style.display = 'none';
}

// ---------- Admin ----------

async function admin_listarLeads() {
  const supabase = getSupabase();
  const { data } = await supabase.from('leads').select('*').order('criado_em', { ascending: false });

  document.getElementById('admin-lista-leads').innerHTML = (data || []).map(l => `
    <div class="admin-item-linha">
      <div>
        <strong>${l.nome}</strong>
        <div class="muted">${l.whatsapp}${l.email ? ' · ' + l.email : ''}</div>
        <div class="muted" style="font-size:11px">${formatarDataBR(l.criado_em ? l.criado_em.split('T')[0] : '')}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge ${l.contatado ? 'badge-success' : 'badge-sol'}">${l.contatado ? 'Contatado' : 'Novo'}</span>
        ${!l.contatado ? `<button class="btn btn-outline btn-sm" onclick="admin_marcarLeadContatado('${l.id}')">Marcar contatado</button>` : ''}
      </div>
    </div>
  `).join('') || '<p class="muted">Nenhum lead recebido ainda.</p>';

  admin_atualizarBadgeLeads();
}

async function admin_marcarLeadContatado(id) {
  const supabase = getSupabase();
  await supabase.from('leads').update({ contatado: true }).eq('id', id);
  admin_listarLeads();
}

async function admin_atualizarBadgeLeads() {
  const supabase = getSupabase();
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('contatado', false);

  const botao = document.querySelector('.admin-aba-botao[data-aba="leads"]');
  if (!botao) return;

  let selo = botao.querySelector('.selo-contagem');
  if (count > 0) {
    if (!selo) {
      selo = document.createElement('span');
      selo.className = 'selo-contagem';
      botao.appendChild(selo);
    }
    selo.textContent = count;
  } else if (selo) {
    selo.remove();
  }
}
