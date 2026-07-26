// ============================================================
// BORA — Service Worker (cache offline básico)
// ============================================================

const CACHE_NOME = 'bora-v7';
const ARQUIVOS_PARA_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/utils.js',
  './js/supabase-client.js',
  './js/state.js',
  './js/avatares.js',
  './js/auth.js',
  './js/onboarding.js',
  './js/gamificacao.js',
  './js/checkin.js',
  './js/home.js',
  './js/treino.js',
  './js/execucao.js',
  './js/progresso.js',
  './js/ranking.js',
  './js/badges.js',
  './js/medidas.js',
  './js/dayoff.js',
  './js/uploadmd.js',
  './js/youtube.js',
  './js/notificacoes.js',
  './js/relatorio.js',
  './js/admin.js',
  './js/feedback.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter(n => n !== CACHE_NOME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first pros dados do Supabase (nunca cachear API), cache-first pro resto
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
