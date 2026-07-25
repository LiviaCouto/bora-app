// ============================================================
// BORA — Cliente Supabase (compartilhado)
// ============================================================

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    if (!window.supabase) {
      console.error('Biblioteca do Supabase não carregou. Verifique o <script> no index.html.');
      return null;
    }
    supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}
