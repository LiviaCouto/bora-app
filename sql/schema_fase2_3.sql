-- ============================================================
-- BORA — Extensão do schema (Fase 2 e 3)
-- Rode isso DEPOIS do schema.sql original, no SQL Editor.
-- Use "Run without RLS" de novo, mesma lógica de antes.
-- ============================================================

-- ---------- FASE 2 ----------

-- Avatares fixos (armazenamos só o id do arquivo estático em icons/avatars/)
alter table perfis alter column avatar_id set default 'coelha-halteres';

-- Campo pra saber quando o vídeo de um exercício foi confirmado (Fase 2 - YouTube)
alter table biblioteca_exercicios add column if not exists video_confirmado boolean default false;

-- ---------- FASE 3 ----------

-- Medidas corporais (privado, opcional)
create table if not exists medidas_corporais (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  data date not null default current_date,
  peso_kg numeric,
  cintura_cm numeric,
  braco_cm numeric,
  observacao text,
  criado_em timestamptz default now()
);

-- Escala de dor/cansaço pós-treino (por check-in)
alter table checkins add column if not exists nivel_cansaco int check (nivel_cansaco between 1 and 5);
alter table checkins add column if not exists dor_local text;

-- Modo "day off": marca um dia como pausa sem quebrar streak
create table if not exists dias_pausa (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  data date not null default current_date,
  motivo text,
  unique (perfil_id, data)
);

-- RLS pras tabelas novas (mesma lógica aberta de antes, controlada pelo app)
alter table medidas_corporais enable row level security;
create policy "leitura publica medidas" on medidas_corporais for select using (true);
create policy "escrita publica medidas" on medidas_corporais for all using (true);

alter table dias_pausa enable row level security;
create policy "leitura publica dias_pausa" on dias_pausa for select using (true);
create policy "escrita publica dias_pausa" on dias_pausa for all using (true);

alter table biblioteca_exercicios enable row level security;
create policy "leitura publica biblioteca" on biblioteca_exercicios for select using (true);
create policy "escrita publica biblioteca" on biblioteca_exercicios for all using (true);

alter table tipos_atividade enable row level security;
create policy "leitura publica tipos" on tipos_atividade for select using (true);
create policy "escrita publica tipos" on tipos_atividade for all using (true);

alter table atividades_livres enable row level security;
create policy "leitura publica ativ_livres" on atividades_livres for select using (true);
create policy "escrita publica ativ_livres" on atividades_livres for all using (true);

alter table progresso_cargas enable row level security;
create policy "leitura publica progresso" on progresso_cargas for select using (true);
create policy "escrita publica progresso" on progresso_cargas for all using (true);

alter table badges_conquistados enable row level security;
create policy "leitura publica badges" on badges_conquistados for select using (true);
create policy "escrita publica badges" on badges_conquistados for all using (true);

alter table desafios_semanais enable row level security;
create policy "leitura publica desafios" on desafios_semanais for select using (true);
create policy "escrita publica desafios" on desafios_semanais for all using (true);

alter table feedbacks enable row level security;
create policy "leitura publica feedbacks" on feedbacks for select using (true);
create policy "escrita publica feedbacks" on feedbacks for all using (true);

alter table convites enable row level security;
create policy "leitura publica convites" on convites for select using (true);
create policy "escrita publica convites" on convites for all using (true);
