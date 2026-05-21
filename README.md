# ⚡ FitQuest — Life OS Gamificado

App SaaS brasileiro que unifica **fitness + produtividade + finanças** com sistema de XP, level up, streaks e coach de IA. Estilo Hevy + Todoist + Mobills + Habitica em um só lugar.

---

## 🚀 Setup do Zero (passo a passo)

### 1️⃣ Pré-requisitos

```bash
# Instalar Node.js 20+ (se ainda não tem)
node --version  # deve mostrar v20.x.x ou superior

# Instalar git
git --version
```

### 2️⃣ Criar projeto Next.js

```bash
# No terminal, na pasta onde você quer criar o projeto:
npx create-next-app@latest fitquest --typescript --tailwind --app --src-dir --turbopack --no-eslint

cd fitquest
```

Quando perguntar:
- **Would you like to use ESLint?** → **No** (vamos adicionar depois)
- **Would you like to customize the default import alias?** → **No** (manter `@/*`)

### 3️⃣ Substituir arquivos pelo zip

Extraia o zip do FitQuest **dentro da pasta `fitquest/`** que acabou de criar.  
Sobrescreva os arquivos quando o sistema perguntar.

```bash
# Estrutura esperada após extrair:
fitquest/
├── README.md          ← este arquivo
├── CLAUDE.md          ← contexto pra qualquer IA
├── package.json
├── supabase/
│   ├── schema.sql
│   ├── seed.sql
│   └── rls.sql
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── middleware.ts
└── ...
```

### 4️⃣ Instalar dependências

```bash
npm install
```

### 5️⃣ Configurar Supabase

**a)** Criar conta em https://supabase.com → New Project

**b)** Quando o projeto subir, vá em **SQL Editor** e cole/execute na ordem:

1. `supabase/schema.sql` — cria todas as tabelas
2. `supabase/rls.sql` — habilita Row Level Security
3. `supabase/seed.sql` — popula exercícios + conquistas + categorias

**c)** Em **Authentication → Providers**, habilite Email/Password.

**d)** Em **Settings → API**, copie:
- Project URL
- `anon` `public` key
- `service_role` key (🔒 server-only)

### 6️⃣ Variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas chaves:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=...
CRON_SECRET=gera_uma_string_aleatoria_grande_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7️⃣ Rodar localmente

```bash
npm run dev
```

Abre em http://localhost:3000

### 8️⃣ Deploy no Vercel

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod
```

No **Vercel Dashboard → Settings → Environment Variables**, adicione todas as variáveis do `.env.local`.

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (public)/              ← sem auth
│   │   ├── page.tsx           ← landing/funil
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── (app)/                 ← requer auth + subscription
│   │   ├── layout.tsx         ← sidebar + bottom nav
│   │   ├── dashboard/         ← Life OS overview
│   │   ├── habitos/           ← hábitos + contribution graph
│   │   ├── treinos/           ← log de treinos (Hevy style)
│   │   ├── tarefas/           ← Kanban + Eisenhower
│   │   ├── financas/          ← transações + metas
│   │   ├── score/             ← analytics gerais
│   │   ├── coach/             ← chat IA contextualizado
│   │   ├── planos/            ← upgrade
│   │   └── perfil/
│   │
│   ├── onboarding/page.tsx    ← wizard pós-signup
│   │
│   └── api/
│       ├── habits/            ← CRUD hábitos
│       ├── tasks/             ← CRUD tarefas
│       ├── transactions/      ← CRUD finanças
│       ├── coach/             ← chat com Claude
│       ├── webhook/mercadopago/
│       └── cron/streaks/
│
├── components/                ← componentes React
├── lib/
│   ├── supabase/              ← clients tipados
│   ├── xp.ts                  ← sistema unificado de XP
│   ├── streak.ts              ← cálculo de streak
│   ├── score.ts               ← cálculo de score
│   └── mercadopago.ts         ← wrapper MP
│
└── middleware.ts              ← proteção de rotas
```

---

## 💰 Modelo de Cobrança

**Híbrido:**
- **Mensal:** R$ 37,00/mês
- **Anual:** R$ 25,55/mês (cobrado 1x ao ano = R$ 306,60)
- **Vitalício:** R$ 597,00 (pagamento único, acesso para sempre)

A escolha do plano é feita na rota `/planos`.

---

## 🎮 Sistema de Gamificação

| Ação | XP |
|---|---|
| Hábito concluído | +50 |
| Dia perfeito (todos hábitos) | +200 (bônus) |
| Treino finalizado | +100 + (sets × 5) até +300 |
| Personal Record | +150 |
| Tarefa concluída | +30 |
| Tarefa urgente+importante concluída | +50 |
| Transação registrada | +5 |
| Conta paga em dia | +20 |
| Meta financeira batida | +500 |
| Streak 7 dias | +300 |
| Streak 30 dias | +1.000 |

**Levels:** 8 níveis de Iniciante (0 XP) até FitQuest Master (35.000+ XP).

---

## 🛠️ Comandos Úteis

```bash
npm run dev          # rodar local
npm run build        # build produção
npm run start        # rodar build local
npm run lint         # verificar erros
npx tsc --noEmit     # checar tipos sem buildar
```

---

## 📚 Próximos Passos

1. ✅ Setup inicial (este README)
2. 📋 Ler `CLAUDE.md` para entender a arquitetura
3. 🎨 Customizar cores em `tailwind.config.ts`
4. 🔌 Configurar webhook do Mercado Pago em produção
5. 🌐 Comprar domínio e apontar no Vercel
6. 📱 Adicionar PWA (Progressive Web App)

---

## 🆘 Suporte

Se algo quebrar, verifique nesta ordem:
1. `.env.local` tem todas as variáveis?
2. Supabase: o schema rodou sem erros?
3. RLS está habilitado nas tabelas?
4. Console do browser tem erros?

Tudo aqui é TypeScript strict — qualquer `any` é red flag.
