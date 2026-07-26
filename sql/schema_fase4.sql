-- ============================================================
-- BORA — Extensão do schema (Fase 4)
-- Rode DEPOIS do schema.sql e schema_fase2_3.sql, no SQL Editor.
-- "Run without RLS", mesma lógica de sempre.
-- ============================================================

-- Vídeo do YouTube direto no exercício do treino (mais simples que
-- depender só da biblioteca — funciona pra qualquer exercício,
-- inclusive os importados por colar texto)
alter table exercicios add column if not exists video_id text;

-- Horário de início e fim da sessão de treino (além da data já existente)
alter table checkins add column if not exists hora_inicio timestamptz;
alter table checkins add column if not exists hora_fim timestamptz;
