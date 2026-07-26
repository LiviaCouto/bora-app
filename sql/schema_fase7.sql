-- ============================================================
-- BORA — Extensão do schema (Fase 7)
-- Fotos de treino em papel + biblioteca de exercícios pra montar
-- o treino clicando, sem precisar digitar nada.
-- Rode no SQL Editor, "Run without RLS".
-- ============================================================

-- ---------- BUCKET DE ARMAZENAMENTO DE FOTOS ----------
insert into storage.buckets (id, name, public)
values ('fotos-treino', 'fotos-treino', true)
on conflict (id) do nothing;

create policy "leitura publica fotos treino" on storage.objects
  for select using (bucket_id = 'fotos-treino');
create policy "upload publico fotos treino" on storage.objects
  for insert with check (bucket_id = 'fotos-treino');

-- ---------- TABELA DE FOTOS PENDENTES DE REVISÃO ----------
create table if not exists fotos_treino (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  foto_url text not null,
  status text not null default 'pendente' check (status in ('pendente','processada')),
  observacao text,
  criado_em timestamptz default now()
);

alter table fotos_treino enable row level security;
create policy "leitura publica fotos_treino" on fotos_treino for select using (true);
create policy "escrita publica fotos_treino" on fotos_treino for all using (true);

-- ---------- BIBLIOTECA DE EXERCÍCIOS (musculação, por grupo muscular) ----------
insert into biblioteca_exercicios (nome, grupo_muscular, tipo_atividade_id)
select nome, grupo_muscular, (select id from tipos_atividade where nome = 'Musculação')
from (values
  ('Supino reto (barra)', 'peito'),
  ('Supino inclinado (barra)', 'peito'),
  ('Supino declinado (barra)', 'peito'),
  ('Supino reto (halteres)', 'peito'),
  ('Supino inclinado (halteres)', 'peito'),
  ('Crucifixo reto (halteres)', 'peito'),
  ('Crucifixo inclinado (halteres)', 'peito'),
  ('Crossover (cabo)', 'peito'),
  ('Peck deck (voador)', 'peito'),
  ('Flexão de braço', 'peito'),

  ('Puxada frente (pulley)', 'costas'),
  ('Puxada atrás (pulley)', 'costas'),
  ('Puxada supinada', 'costas'),
  ('Remada baixa (pulley)', 'costas'),
  ('Remada curvada (barra)', 'costas'),
  ('Remada unilateral (halter)', 'costas'),
  ('Remada cavalinho', 'costas'),
  ('Pulldown (corda)', 'costas'),
  ('Barra fixa', 'costas'),
  ('Levantamento terra', 'costas'),

  ('Desenvolvimento militar (barra)', 'ombro'),
  ('Desenvolvimento com halteres', 'ombro'),
  ('Elevação lateral', 'ombro'),
  ('Elevação frontal', 'ombro'),
  ('Elevação posterior', 'ombro'),
  ('Remada alta', 'ombro'),
  ('Encolhimento de ombros', 'ombro'),

  ('Rosca direta (barra)', 'biceps'),
  ('Rosca alternada (halteres)', 'biceps'),
  ('Rosca martelo', 'biceps'),
  ('Rosca scott', 'biceps'),
  ('Rosca concentrada', 'biceps'),
  ('Rosca no cabo', 'biceps'),

  ('Tríceps pulley (corda)', 'triceps'),
  ('Tríceps pulley (barra)', 'triceps'),
  ('Tríceps testa', 'triceps'),
  ('Tríceps francês', 'triceps'),
  ('Tríceps coice', 'triceps'),
  ('Mergulho no banco', 'triceps'),

  ('Agachamento livre', 'perna'),
  ('Agachamento smith', 'perna'),
  ('Agachamento sumô', 'perna'),
  ('Leg press 45°', 'perna'),
  ('Cadeira extensora', 'perna'),
  ('Cadeira flexora', 'perna'),
  ('Stiff', 'perna'),
  ('Levantamento terra romeno', 'perna'),
  ('Afundo (passada)', 'perna'),
  ('Cadeira abdutora', 'perna'),
  ('Cadeira adutora', 'perna'),
  ('Elevação pélvica (hip thrust)', 'perna'),
  ('Panturrilha em pé', 'perna'),
  ('Panturrilha sentado', 'perna'),

  ('Abdominal supra', 'abdomen'),
  ('Abdominal infra', 'abdomen'),
  ('Prancha', 'abdomen'),
  ('Prancha lateral', 'abdomen'),
  ('Abdominal na polia', 'abdomen'),
  ('Elevação de pernas', 'abdomen')
) as lista(nome, grupo_muscular)
where not exists (
  select 1 from biblioteca_exercicios be where be.nome = lista.nome
);
