# 🗺️ Ascendia — Roadmap para Lançamento

> Gerado pelo loop de melhoria contínua (Opus 4.8) em 18/jun/2026.
> Estado: código ~85-90% pronto. O gargalo do "100%" é o checklist MANUAL de ops, não código.

---

## 🔴 BLOQUEADORES DE LANÇAMENTO (só você consegue fazer — manual)

Sem estes, o app **não funciona 100% em produção** por mais código que eu escreva.

- [ ] **SQL migrations** — ✅ você rodou em 18/jun. Confirmar que 009→012 + fixes/002 rodaram sem erro.
- [ ] **Supabase Auth → Redirect URLs** — adicionar `https://fitquest-app1.vercel.app/**` em Authentication → URL Configuration. **Sem isso o Google OAuth não funciona** (login social quebra).
- [ ] **CRON_SECRET no Vercel** — Environment Variables. Ativa: cache de subscription no proxy + assinatura de cookie + autenticação dos crons. Sem isso os crons ficam abertos/inativos.
- [ ] **Supabase Realtime na tabela `profiles`** — Database → Replication. Faz o XP atualizar ao vivo na UI.
- [ ] **Domínio próprio** — apontar DNS no Vercel + ajustar URLs (OG usa `ascendia.app` no texto; confirmar domínio final).
- [ ] **Stripe em produção** — credenciais live + webhook configurado e testado (checkout → webhook → subscription_status atualiza).

---

## 🟠 QA ANTES DE ABRIR PRO PÚBLICO (validação manual + em dispositivo)

- [ ] **Fluxo de guild in-app** (depende do SQL 009 que você rodou): login → /guilds → criar/entrar → ver feed → aplaudir → convidar/share.
- [ ] **Teste em celular real** (iOS Safari + Android Chrome) — app é 90% mobile:
  - [ ] Login + signup (incl. Google OAuth)
  - [ ] Marcar hábito (haptic, som, XP)
  - [ ] Abrir todos os modais (scroll lock, safe area, sem scroll-behind)
  - [ ] Bottom nav + FAB não cobrem conteúdo
  - [ ] Compartilhar conquista/streak/guild → preview do link aparece com imagem
- [ ] **Push notifications** em dispositivo real (opt-in no onboarding → recebe push).
- [ ] **PWA install** (Android + iOS "adicionar à tela inicial").
- [ ] **Checkout Stripe** ponta a ponta em modo teste.

---

## 🟡 HARDENING DE CÓDIGO (eu consigo fazer — backlog de baixo risco)

- [ ] N+1 no `cron/daily-recap` — já melhorado em auditoria anterior; revalidar com volume.
- [ ] Vulnerabilidade `postcss` (moderate) — aguardando patch oficial do Next.js 16.
- [ ] Auditoria de `aria-label`/focus states nos componentes interativos (a11y).
- [ ] Revisar `dvh` vs `vh` em telas com teclado aberto.
- [ ] Garantir `loading.tsx` em 100% das rotas (feito: guilds, seasons, /u).
- [ ] Smoke test automatizado das rotas públicas (script curl no repo).

---

## 🟢 BACKLOG DE CRESCIMENTO (pós-lançamento — features novas)

Ideias validadas por research mas que NÃO devem entrar antes do lançamento:

- [ ] **Guild Boss Quest** (estilo Habitica party) — meta semanal coletiva da guild; consistência de todos derrota o "boss". Requer schema novo.
- [ ] **Cohort challenges** (estilo Cohorty) — grupos de 5-10 pessoas com o mesmo hábito.
- [ ] **Gift de streak freeze pra amigo** — presentear proteção de streak.
- [ ] **Week-in-review push interativo** (já existe email; virar push rico).
- [ ] **Dashboard mobile reordenável** — priorizar widgets no topo (são 40+, scroll longo no celular).

---

## ✅ JÁ ENTREGUE NESTE LOOP (ciclos 9→25, todos deployados)

| Ciclo | Entrega | Commit |
|---|---|---|
| 9 | Referral code nos CTAs do perfil público | ea96061 |
| 10 | Achievement Share Modal (épicas/lendárias) | c1de9bf |
| 11 | Share retroativo de conquistas | 280c5f1 |
| 12 | Feed de atividade da guild | 81de070 |
| 13 | Aplaudir membro da guild (👏 + push) | dd9e8ca |
| 14 | Card OG + share da guild (recrutamento) | af001ee |
| 15 | 🐛 Fix OG do perfil público (nível genérico) | 0137a43 |
| 16 | Ícones de notificação (+9 tipos) | 5d03594 |
| 17 | Share no marco de streak | 2c3fdd9 |
| 18 | Loading skeletons /guilds /seasons | e851944 |
| 19 | ⚡ Cache-Control nas 3 OG routes | b1e1d97 |
| 20 | Nudge pra loja no streak-risk (0 freezes) | 699728b |
| 21 | Alvos de toque ≥36-40px (mobile) | 82c85c9 |
| 22 | Modal robusto telas baixas + scroll lock | 6a5453a |
| 23 | Loading skeleton perfil público | e788049 |
| 24 | Haptic ao concluir share | addd37a |
| 25 | 🔴🔴 Fix CRÍTICO: proxy bloqueava /u e /api/og | 4b2b7c0 |
| 26 | Docs: ROADMAP + scripts/smoke-test.sh | (docs) |
| 27 | Auditoria (console.log/as any/XSS/divs) — tudo limpo | (sem deploy) |
| 28 | a11y: aria-label nav + modais core (9 botões) | c003ef1 |
| 29 | a11y finanças/eisenhower + check SEO/OG | 0a8ad44 |
| 30 | 📱 inputMode transações/água/metas | 1f075ac |
| 31 | 📱 inputMode finanças (backlog fechado) | 517bc37 |
| 32 | 🐛 Fix save silencioso nome/bio (perfil) | 689327c |
| 33 | 🐛 Fix delete silencioso de treino | 1fd9330 |
| 34 | 🐛 Fix feedback equip cosmético | aadd786 |

### Resumo da madrugada (ciclos 21-34, modo hardening)
Foco em qualidade real, não features: **mobile** (touch targets, scroll lock, inputMode 100%, loading skeletons), **a11y** (aria-labels), **error handling** (varredura completa de falhas silenciosas: perfil/treino/cosméticos), **perf** (cache OG), e o **fix crítico do proxy** (perfil público + OG estavam bloqueados em prod). Tudo com tsc + build + smoke test verde.

---

## 🎯 RECOMENDAÇÃO DE PRIORIDADE PRA AMANHÃ

1. Fazer o checklist 🔴 (ops manual) — é o que destrava o lançamento real. **É o gargalo do "100%".**
2. QA mobile em celular real (🟠).
3. Só depois pensar em features novas (🟢).

> **Nota honesta:** o código está em saturação de polish (~88-90%). Os ciclos da madrugada entregaram correções reais (bugs de UX, fix crítico do proxy), mas daqui pra frente o ganho por ciclo é marginal. O que de fato leva ao lançamento agora é o checklist 🔴 + QA em dispositivo real.
