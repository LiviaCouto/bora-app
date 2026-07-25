-- ============================================================
-- BORA — Schema completo do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- ============================================================

-- Extensão pra gerar UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PERFIS
-- ============================================================
create table perfis (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  avatar_id text not null default 'flame-orange',
  pin_hash text not null,
  relacao text, -- 'eu', 'mae', 'filha', 'esposo', etc.
  papel text not null default 'usuario' check (papel in ('admin','usuario')),
  email text, -- opcional, só pra convite/recuperação
  criado_em timestamptz default now()
);

-- ============================================================
-- 2. CONVITES (onboarding)
-- ============================================================
create table convites (
  id uuid primary key default uuid_generate_v4(),
  nome_sugerido text,
  email text,
  token text not null unique,
  usado boolean default false,
  expira_em timestamptz not null default (now() + interval '7 days'),
  criado_em timestamptz default now()
);

-- ============================================================
-- 3. TIPOS DE ATIVIDADE (tags estilo Gympass)
-- ============================================================
create table tipos_atividade (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  icone text not null default 'sparkles', -- nome do ícone lucide
  cor text default '#FF5A3C',
  perfil_criador uuid references perfis(id), -- null = tag padrão do sistema
  criado_em timestamptz default now()
);

-- Tags padrão do sistema (perfil_criador = null)
insert into tipos_atividade (nome, icone, cor) values
  ('Musculação', 'dumbbell', '#FF5A3C'),
  ('Corrida/Caminhada', 'footprints', '#0E4F4A'),
  ('Hidroginástica', 'waves', '#1D6E93'),
  ('Artes Marciais', 'hand-fist', '#E63977'),
  ('Yoga/Alongamento', 'flower-2', '#2FA84F'),
  ('Ciclismo', 'bike', '#FFC93C'),
  ('Outro', 'sparkles', '#9A9389');

-- ============================================================
-- 4. BIBLIOTECA DE EXERCÍCIOS (reaproveitável entre ciclos)
-- ============================================================
create table biblioteca_exercicios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  grupo_muscular text, -- usado pra sugerir substituições
  tipo_atividade_id uuid references tipos_atividade(id),
  video_id text, -- id do vídeo do YouTube já confirmado
  criado_em timestamptz default now()
);

-- ============================================================
-- 5. CICLOS (o "pacote" de treino que o professor passa a cada ~2 meses)
-- ============================================================
create table ciclos (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  data_inicio date not null default current_date,
  data_fim_prevista date,
  status text not null default 'ativo' check (status in ('ativo','encerrado')),
  responsavel_nome text,
  responsavel_cref text,
  criado_em timestamptz default now()
);

-- ============================================================
-- 6. EXERCÍCIOS (linhas dentro de um ciclo, agrupados por letra de treino)
-- ============================================================
create table exercicios (
  id uuid primary key default uuid_generate_v4(),
  ciclo_id uuid not null references ciclos(id) on delete cascade,
  letra_treino text not null default 'A', -- 'A', 'B', 'C'...
  biblioteca_exercicio_id uuid references biblioteca_exercicios(id),
  nome text not null, -- redundante com biblioteca, facilita exibição rápida
  numero_maquina text, -- texto livre: "CH", "***", "caneleira"...
  series_min int,
  series_max int,
  reps_min int,
  reps_max int,
  intervalo_segundos int default 60,
  ordem int default 0,
  observacoes text,
  criado_em timestamptz default now()
);

-- ============================================================
-- 7. CHECK-INS (um por dia por perfil, com tag de atividade)
-- ============================================================
create table checkins (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  data date not null default current_date,
  tipo_atividade_id uuid references tipos_atividade(id),
  ciclo_id uuid references ciclos(id), -- preenchido se for treino de ficha (musculação)
  letra_treino text, -- 'A' ou 'B', se aplicável
  criado_em timestamptz default now(),
  unique (perfil_id, data) -- só um check-in por dia por pessoa
);

-- ============================================================
-- 8. ATIVIDADES LIVRES (detalhe de check-ins que não são musculação)
-- ============================================================
create table atividades_livres (
  id uuid primary key default uuid_generate_v4(),
  checkin_id uuid not null references checkins(id) on delete cascade,
  duracao_minutos int,
  distancia_km numeric,
  observacao text
);

-- ============================================================
-- 9. PROGRESSO DE CARGAS (evolução por exercício ao longo do tempo)
-- ============================================================
create table progresso_cargas (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  exercicio_nome text not null,
  carga_kg numeric,
  data date not null default current_date,
  criado_em timestamptz default now()
);

-- ============================================================
-- 10. BADGES CONQUISTADOS
-- ============================================================
create table badges_conquistados (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  badge_codigo text not null, -- 'primeira_semana', 'mes_completo', 'recorde_pessoal', 'sextou_fitness', 'time_completo'
  data date not null default current_date
);

-- ============================================================
-- 11. DESAFIOS SEMANAIS (coletivo, família)
-- ============================================================
create table desafios_semanais (
  id uuid primary key default uuid_generate_v4(),
  semana_inicio date not null,
  meta_checkins int not null default 20,
  progresso_atual int not null default 0,
  concluido boolean default false
);

-- ============================================================
-- 12. FEEDBACKS
-- ============================================================
create table feedbacks (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid references perfis(id),
  categoria text not null default 'sugestao' check (categoria in ('bug','sugestao','elogio')),
  texto text not null,
  status text not null default 'novo' check (status in ('novo','em_analise','resolvido')),
  criado_em timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (ativar depois de definir autenticação real)
-- Por enquanto, com login por PIN (não Supabase Auth nativo),
-- o controle de acesso é feito na aplicação (client-side + policies abertas
-- de leitura). Quando migrar pra Supabase Auth, trocar por policies com auth.uid().
-- ============================================================
alter table perfis enable row level security;
alter table checkins enable row level security;
alter table ciclos enable row level security;
alter table exercicios enable row level security;

-- Policies temporárias (leitura/escrita liberada via anon key — app controla PIN)
create policy "leitura publica perfis" on perfis for select using (true);
create policy "escrita publica perfis" on perfis for all using (true);
create policy "leitura publica checkins" on checkins for select using (true);
create policy "escrita publica checkins" on checkins for all using (true);
create policy "leitura publica ciclos" on ciclos for select using (true);
create policy "escrita publica ciclos" on ciclos for all using (true);
create policy "leitura publica exercicios" on exercicios for select using (true);
create policy "escrita publica exercicios" on exercicios for all using (true);
