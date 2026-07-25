// ============================================================
// BORA — Notificações
//
// IMPORTANTE (leia antes de confiar 100% nisso): push notification
// "de verdade" (o servidor acordar o celular mesmo com o app fechado)
// exige um backend com VAPID keys + um serviço rodando 24h pra disparar
// no horário certo. Isso está fora do escopo de um site estático no
// GitHub Pages. O que dá pra fazer sem backend, e é o que este módulo
// faz, é:
//   1. Pedir permissão de notificação do navegador
//   2. Agendar lembretes locais enquanto o app estiver aberto (ou em
//      segundo plano recente) usando o Service Worker
// Se no futuro quiser push de verdade, a próxima etapa é criar uma
// Supabase Edge Function agendada (cron) + biblioteca web-push.
// ============================================================

async function notificacoes_pedirPermissao() {
  if (!('Notification' in window)) {
    alert('Seu navegador não suporta notificações.');
    return;
  }
  const permissao = await Notification.requestPermission();
  document.getElementById('notificacoes-status').textContent =
    permissao === 'granted' ? 'Notificações ativadas ✅' : 'Notificações não autorizadas';
}

function notificacoes_mostrarLembreteLocal(titulo, corpo) {
  if (Notification.permission !== 'granted') return;
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) {
      reg.showNotification(titulo, { body: corpo, icon: 'icons/icon-192.png' });
    } else {
      new Notification(titulo, { body: corpo });
    }
  });
}

// Verifica, enquanto o app está aberto, se já passou do horário
// habitual sem check-in hoje — dispara um lembrete local gentil.
async function notificacoes_verificarLembreteCheckin() {
  const perfil = AppState.perfilAtual;
  if (!perfil) return;

  const agora = new Date();
  if (agora.getHours() < 18) return; // só lembra a partir do fim da tarde

  const supabase = getSupabase();
  const { data } = await supabase
    .from('checkins').select('id').eq('perfil_id', perfil.id).eq('data', todayLocal()).maybeSingle();

  if (!data) {
    notificacoes_mostrarLembreteLocal('Bora treinar hoje?', 'Ainda não vi seu check-in de hoje 🔥');
  }
}
