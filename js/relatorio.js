// ============================================================
// BORA — Relatório mensal exportável (PDF)
// Usa jsPDF (carregado via CDN no index.html)
// ============================================================

async function relatorio_gerarPDF() {
  const perfil = AppState.perfilAtual;
  const supabase = getSupabase();

  const { data: checkins } = await supabase
    .from('checkins')
    .select('data, letra_treino, nivel_cansaco')
    .eq('perfil_id', perfil.id)
    .order('data', { ascending: false })
    .limit(60);

  const total = (checkins || []).length;
  const streak = calcularStreak(checkins || []);
  const nivel = calcularNivel(total);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Bora — Relatório de Treino', 14, 20);

  doc.setFontSize(11);
  doc.text(`Perfil: ${perfil.nome}`, 14, 32);
  doc.text(`Data do relatório: ${formatarDataBR(todayLocal())}`, 14, 39);
  doc.text(`Total de check-ins: ${total}`, 14, 50);
  doc.text(`Streak atual: ${streak} dias`, 14, 57);
  doc.text(`Nível: ${nivel.nome}`, 14, 64);

  doc.setFontSize(13);
  doc.text('Últimos check-ins', 14, 78);
  doc.setFontSize(10);

  let y = 86;
  (checkins || []).slice(0, 30).forEach(c => {
    doc.text(`${formatarDataBR(c.data)} — Treino ${c.letra_treino || '-'}`, 14, y);
    y += 6;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  doc.save(`bora-relatorio-${perfil.nome.toLowerCase()}-${todayLocal()}.pdf`);
}
