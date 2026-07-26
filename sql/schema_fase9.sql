-- ============================================================
-- BORA — Extensão do schema (Fase 9)
-- Rode no SQL Editor, "Run without RLS".
-- ============================================================

-- Check-ins ilimitados por dia (remove a trava de "só 1 por dia")
alter table checkins drop constraint if exists checkins_perfil_id_data_key;

-- Nome do ciclo (aparece na listagem) e nome da academia (no lugar do CREF)
alter table ciclos add column if not exists nome_ciclo text;
alter table ciclos add column if not exists nome_academia text;

-- Captura de leads (landing page)
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  whatsapp text not null,
  email text,
  contatado boolean not null default false,
  criado_em timestamptz default now()
);

alter table leads enable row level security;
create policy "leitura publica leads" on leads for select using (true);
create policy "escrita publica leads" on leads for all using (true);

-- ---------- MAIS EXERCÍCIOS: CARDIO, FUNCIONAL E VARIEDADE EXTRA ----------
insert into biblioteca_exercicios (nome, grupo_muscular, tipo_atividade_id)
select nome, grupo_muscular, (select id from tipos_atividade where nome = 'Musculação')
from (values
  ('Esteira', 'cardio'),
  ('Bicicleta ergométrica', 'cardio'),
  ('Elíptico', 'cardio'),
  ('Escada ergométrica (stairmaster)', 'cardio'),
  ('Remo ergométrico', 'cardio'),
  ('Jump (cama elástica)', 'cardio'),
  ('Pular corda', 'cardio'),
  ('Spinning', 'cardio'),
  ('HIIT (intervalado)', 'cardio'),

  ('Kettlebell swing', 'funcional'),
  ('Battle rope (corda naval)', 'funcional'),
  ('Box jump', 'funcional'),
  ('TRX remada', 'funcional'),
  ('Burpee', 'funcional'),
  ('Mountain climber', 'funcional'),
  ('Agachamento com salto', 'funcional'),
  ('Slam ball', 'funcional'),
  ('Sled push/puxada de trenó', 'funcional'),
  ('Wall ball', 'funcional'),

  ('Peito na máquina (hammer strength)', 'peito'),
  ('Flexão declinada', 'peito'),

  ('Remo cavalinho unilateral', 'costas'),
  ('Face pull', 'costas'),

  ('Arnold press', 'ombro'),
  ('Elevação lateral no cabo', 'ombro'),

  ('Rosca 21', 'biceps'),
  ('Rosca inversa', 'biceps'),

  ('Extensão de tríceps unilateral', 'triceps'),

  ('Cadeira flexora unilateral', 'perna'),
  ('Agachamento búlgaro', 'perna'),
  ('Passada com halteres', 'perna'),
  ('Elevação de panturrilha no smith', 'perna'),

  ('Abdominal canivete', 'abdomen'),
  ('Russian twist', 'abdomen')
) as lista(nome, grupo_muscular)
where not exists (
  select 1 from biblioteca_exercicios be where be.nome = lista.nome
);
