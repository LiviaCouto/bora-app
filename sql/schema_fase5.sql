-- ============================================================
-- BORA — Extensão do schema (Fase 5)
-- Rode DEPOIS dos scripts anteriores, no SQL Editor.
-- "Run without RLS", mesma lógica de sempre.
-- ============================================================

-- Tag de Natação, que faltava na lista de tipos de atividade
insert into tipos_atividade (nome, icone, cor)
select 'Natação', 'waves', '#1D6E93'
where not exists (select 1 from tipos_atividade where nome = 'Natação');
