# Bora — App de treino em família

## Passo a passo pra colocar no ar

### 1. Banco de dados (Supabase)
1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, cole e rode todo o conteúdo do arquivo `sql/schema.sql`
3. Vá em **Settings → API** e copie:
   - `Project URL`
   - `anon public key`

### 2. Configurar o app
Abra `js/config.js` e cole suas chaves:
```js
SUPABASE_URL: 'https://xxxxx.supabase.co',
SUPABASE_ANON_KEY: 'sua-chave-aqui',
```
(A `YOUTUBE_API_KEY` pode ficar como placeholder por enquanto — só é usada na Fase 2, integração de vídeos.)

### 3. Subir pro GitHub Pages
1. Crie um repositório novo no GitHub (ex: `bora-app`)
2. Suba todos esses arquivos e pastas pra raiz do repositório
3. Vá em **Settings → Pages** do repositório → Branch: `main` → pasta `/ (root)`
4. Seu link vai ficar tipo `https://seu-usuario.github.io/bora-app/`

### 4. Primeiro uso
1. Abra o link no celular
2. Como ainda não tem nenhum perfil, você vai precisar criar o **primeiro admin direto no banco** (via Supabase → Table Editor → tabela `perfis` → Insert row), já que a tela de criação de perfil fica dentro da área Admin (que exige login).
   - Gere o hash do PIN: abra o console do navegador em qualquer página e rode:
     ```js
     await hashPin('1234') // troque 1234 pelo PIN que quiser
     ```
     (isso funciona se você abrir o `index.html` primeiro, já que a função `hashPin` já estará carregada)
   - Cole o resultado no campo `pin_hash` da nova linha, e marque `papel` como `admin`
3. A partir daí, você já consegue logar como admin e criar os outros 3 perfis direto pelo app (aba Admin → Perfis)

### 5. Rodar o schema de Fase 2/3
No mesmo SQL Editor, cole e rode também o conteúdo do arquivo `sql/schema_fase2_3.sql` (escolha **"Run without RLS"** de novo).

## O que já está funcionando (Fase 1 completa + Fase 2 e 3)

### Fase 1
- Login por perfil + PIN
- Home com treino do dia + streak + nível
- Escolha do treino do dia (A/B) → execução guiada exercício por exercício
- Check-in com tags de atividade (Musculação abre treino de ficha; outras tags = treino livre)
- Progresso: heatmap de assiduidade + gráfico de evolução de carga
- Admin: perfis, ciclos/exercícios, visão geral da família
- Feedback

### Fase 2
- **Avatares fixos estilo Netflix** (pasta `icons/avatars/`, 8 opções — troque por ilustrações melhores quando quiser)
- **Upload de treino via colar texto/MD** com parser automático (Admin → Treinos → dentro de "Gerenciar exercícios")
- **Integração YouTube** — precisa da `YOUTUBE_API_KEY` em `config.js`. Sem a chave, o botão avisa e não trava o app
- **Onboarding via convite** — Admin → Convites → gera link único, você copia e manda por WhatsApp/e-mail
- **Ranking da família** (Progresso → Ranking) — só consistência, nunca carga
- **Badges/conquistas** (Progresso → Minhas conquistas)
- **Notificações locais** (Admin → Notificações) — lembrete de check-in enquanto o app está aberto. Push de verdade com app fechado precisa de um backend (VAPID + serviço agendado) — não incluído ainda, ver nota em `js/notificacoes.js`

### Fase 3
- **Medidas corporais** (privado — Progresso → Medidas corporais)
- **Escala de cansaço pós-treino** (aparece automaticamente ao concluir a execução guiada)
- **Modo Day Off** (botão na Home) — pausa o streak sem quebrar
- **Comparativo entre ciclos** (Progresso → Comparar ciclos)
- **Relatório em PDF** (Progresso → Exportar PDF)
- OCR de foto de treino e integração Google Fit **ainda não implementados** — exigem mais infraestrutura (backend pra OCR sem expor chave de API no navegador; conta de desenvolvedor Google pra Fit). Podemos fazer numa próxima rodada se quiser.

## Ícones do PWA
Os ícones em `icons/` são placeholders simples com a cor da marca. Quando quiser, troque por uma versão mais trabalhada da chama do Bora.
