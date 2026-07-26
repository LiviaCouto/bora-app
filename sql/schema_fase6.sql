-- ============================================================
-- BORA — Extensão do schema (Fase 6)
-- Necessário pra excluir um ciclo sem dar erro de chave estrangeira
-- (os exercícios já apagam em cascata; falta o check-ins).
-- Rode no SQL Editor, "Run without RLS".
-- ============================================================

alter table checkins drop constraint if exists checkins_ciclo_id_fkey;
alter table checkins add constraint checkins_ciclo_id_fkey
  foreign key (ciclo_id) references ciclos(id) on delete cascade;
