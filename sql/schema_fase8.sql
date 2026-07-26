-- ============================================================
-- BORA — Extensão do schema (Fase 8)
-- Campos de idade e objetivo pro perfil editável.
-- Rode no SQL Editor, "Run without RLS".
-- ============================================================

alter table perfis add column if not exists idade int;
alter table perfis add column if not exists objetivo text;
