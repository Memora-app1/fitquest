import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  _resend = new Resend(key)
  return _resend
}

const FROM = 'Ascendia <noreply@ascendia.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ascendia-app1.vercel.app'

export async function sendTrialEndingEmail(to: string, name: string, daysLeft: number) {
  const urgency = daysLeft <= 1 ? '🚨' : '⏰'
  const subject =
    daysLeft <= 1
      ? `${urgency} Seu trial Ascendia termina HOJE`
      : `${urgency} Seu trial Ascendia termina em ${daysLeft} dias`

  await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#050914;color:#fff;font-family:DM Sans,sans-serif;margin:0;padding:0">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:48px">⚡</span>
      <h1 style="font-size:32px;font-weight:900;color:#FF4D00;letter-spacing:2px;margin:8px 0">ASCENDIA</h1>
    </div>

    <h2 style="font-size:22px;font-weight:700;margin:0 0 16px">Oi, ${name}! ${daysLeft <= 1 ? 'hoje é o último dia' : `faltam só ${daysLeft} dias`}.</h2>

    <p style="color:#8899BB;line-height:1.6;margin:0 0 24px">
      Seu período gratuito está acabando. Todo o seu progresso, hábitos e XP estão salvos —
      mas você vai precisar de uma assinatura para continuar acessando o app.
    </p>

    <div style="background:#0D1829;border:1px solid rgba(255,77,0,0.3);border-radius:16px;padding:24px;margin:0 0 24px">
      <p style="font-size:13px;color:#8899BB;margin:0 0 12px">Plano mais popular</p>
      <div style="display:flex;align-items:baseline;gap:4px;margin:0 0 8px">
        <span style="font-size:36px;font-weight:900;color:#FF4D00">R$25,55</span>
        <span style="color:#8899BB">/mês (anual)</span>
      </div>
      <p style="font-size:13px;color:#8899BB;margin:0">Cobrado R$306,60 uma vez por ano. Economize 31%.</p>
    </div>

    <a href="${APP_URL}/planos" style="display:block;text-align:center;background:linear-gradient(135deg,#FF4D00,#7C3AED);color:#fff;font-weight:700;font-size:16px;padding:16px 32px;border-radius:12px;text-decoration:none;margin:0 0 24px">
      Garantir meu acesso →
    </a>

    <p style="color:#8899BB;font-size:13px;line-height:1.6;margin:0 0 32px">
      Cancele quando quiser. Garantia de 7 dias se não gostar.
    </p>

    <hr style="border:none;border-top:1px solid rgba(136,153,187,0.2);margin:0 0 24px">
    <p style="color:#8899BB;font-size:12px;margin:0">
      Ascendia · <a href="${APP_URL}/privacidade" style="color:#FF4D00">Privacidade</a> · <a href="${APP_URL}/termos" style="color:#FF4D00">Termos</a>
    </p>
  </div>
</body>
</html>`,
  })
}

export interface WeeklyDigestStats {
  streakCurrent: number
  streakLongest: number
  xpThisWeek: number
  xpTotal: number
  level: number
  habitsCompletedThisWeek: number
  habitsTarget: number
  tasksCompletedThisWeek: number
  perfectDays: number
  topSources: Array<{ label: string; emoji: string; xp: number }>
}

export async function sendWeeklyDigest(
  to: string,
  name: string,
  stats: WeeklyDigestStats
) {
  const {
    streakCurrent,
    xpThisWeek,
    xpTotal,
    level,
    habitsCompletedThisWeek,
    habitsTarget,
    tasksCompletedThisWeek,
    perfectDays,
    topSources,
  } = stats

  const habitRate =
    habitsTarget > 0 ? Math.round((habitsCompletedThisWeek / habitsTarget) * 100) : 0

  const streakEmoji =
    streakCurrent >= 30 ? '🔥' : streakCurrent >= 7 ? '⚡' : streakCurrent > 0 ? '✨' : '💤'

  const performanceLine =
    habitRate >= 80
      ? 'Semana incrível — você está entre os mais consistentes. 🏆'
      : habitRate >= 50
      ? 'Boa semana! Você está na metade do caminho. Continue. 💪'
      : 'Essa semana foi mais difícil, mas você ainda está aqui. Isso conta. 🌱'

  const topSourcesHtml = topSources
    .slice(0, 3)
    .map(
      (s) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#152238;border-radius:10px;margin-bottom:8px">
      <span style="font-size:14px;color:#FFFFFF">${s.emoji} ${s.label}</span>
      <span style="font-size:14px;font-weight:700;color:#F5C842">+${s.xp.toLocaleString('pt-BR')} XP</span>
    </div>`
    )
    .join('')

  const subject =
    streakCurrent >= 7
      ? `🔥 ${streakCurrent} dias de streak — resumo da sua semana`
      : xpThisWeek > 0
      ? `⚡ Você ganhou ${xpThisWeek.toLocaleString('pt-BR')} XP essa semana`
      : `📊 Seu resumo semanal Ascendia`

  await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#050914;color:#fff;font-family:DM Sans,Arial,sans-serif;margin:0;padding:0">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,77,0,0.1);border:1px solid rgba(255,77,0,0.3);border-radius:50px;padding:6px 16px;margin-bottom:16px">
        <span style="font-size:14px;font-weight:700;color:#FF4D00;letter-spacing:2px">ASCENDIA</span>
      </div>
      <h1 style="font-size:28px;font-weight:900;color:#FFFFFF;margin:0 0 4px">Seu resumo da semana</h1>
      <p style="font-size:14px;color:#8899BB;margin:0">${performanceLine}</p>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
      <div style="background:#0D1829;border:1px solid rgba(255,77,0,0.2);border-radius:14px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#FF4D00">${streakEmoji} ${streakCurrent}</div>
        <div style="font-size:11px;color:#8899BB;margin-top:4px;text-transform:uppercase;letter-spacing:1px">Streak</div>
      </div>
      <div style="background:#0D1829;border:1px solid rgba(245,200,66,0.2);border-radius:14px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#F5C842">+${xpThisWeek.toLocaleString('pt-BR')}</div>
        <div style="font-size:11px;color:#8899BB;margin-top:4px;text-transform:uppercase;letter-spacing:1px">XP esta semana</div>
      </div>
      <div style="background:#0D1829;border:1px solid rgba(0,255,136,0.2);border-radius:14px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#00FF88">${habitsCompletedThisWeek}</div>
        <div style="font-size:11px;color:#8899BB;margin-top:4px;text-transform:uppercase;letter-spacing:1px">Hábitos feitos</div>
      </div>
    </div>

    <!-- Secondary stats -->
    <div style="background:#0D1829;border:1px solid rgba(124,58,237,0.2);border-radius:14px;padding:20px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:13px;color:#8899BB">Nível atual</span>
        <span style="font-size:13px;font-weight:700;color:#9F5AF7">Level ${level}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:13px;color:#8899BB">XP total acumulado</span>
        <span style="font-size:13px;font-weight:700;color:#F5C842">${xpTotal.toLocaleString('pt-BR')} XP</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:13px;color:#8899BB">Tarefas concluídas</span>
        <span style="font-size:13px;font-weight:700;color:#FFFFFF">${tasksCompletedThisWeek}</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:13px;color:#8899BB">Dias perfeitos (total)</span>
        <span style="font-size:13px;font-weight:700;color:#F5C842">⭐ ${perfectDays}</span>
      </div>
    </div>

    ${topSources.length > 0 ? `
    <!-- XP breakdown -->
    <div style="margin-bottom:24px">
      <h3 style="font-size:13px;font-weight:700;color:#8899BB;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px">Fontes de XP esta semana</h3>
      ${topSourcesHtml}
    </div>` : ''}

    <!-- Progress bar for habits -->
    ${habitsTarget > 0 ? `
    <div style="background:#0D1829;border:1px solid rgba(0,255,136,0.15);border-radius:14px;padding:20px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:13px;color:#8899BB">Consistência de hábitos</span>
        <span style="font-size:13px;font-weight:700;color:#00FF88">${habitRate}%</span>
      </div>
      <div style="background:rgba(255,255,255,0.06);border-radius:99px;height:8px;overflow:hidden">
        <div style="height:100%;width:${Math.min(habitRate, 100)}%;background:linear-gradient(90deg,#00FF88,#00D9FF);border-radius:99px"></div>
      </div>
      <p style="font-size:12px;color:#5A6B85;margin:8px 0 0">${habitsCompletedThisWeek} de ${habitsTarget} completados</p>
    </div>` : ''}

    <!-- CTA -->
    <a href="${APP_URL}/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#FF4D00,#7C3AED);color:#fff;font-weight:700;font-size:16px;padding:16px 32px;border-radius:12px;text-decoration:none;margin-bottom:32px">
      Continuar evoluindo →
    </a>

    <hr style="border:none;border-top:1px solid rgba(136,153,187,0.15);margin:0 0 20px">
    <p style="color:#5A6B85;font-size:11px;text-align:center;margin:0;line-height:1.6">
      Ascendia · <a href="${APP_URL}/perfil" style="color:#FF4D00;text-decoration:none">Meu perfil</a> · <a href="${APP_URL}/privacidade" style="color:#8899BB;text-decoration:none">Privacidade</a>
    </p>

  </div>
</body>
</html>`,
  })
}

export async function sendWelcomeEmail(to: string, name: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `⚡ Bem-vindo ao Ascendia, ${name}!`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#050914;color:#fff;font-family:DM Sans,sans-serif;margin:0;padding:0">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:48px">⚡</span>
      <h1 style="font-size:32px;font-weight:900;color:#FF4D00;letter-spacing:2px;margin:8px 0">ASCENDIA</h1>
    </div>

    <h2 style="font-size:22px;font-weight:700;margin:0 0 16px">Bem-vindo, ${name}! Seus 7 dias começaram. 🎉</h2>

    <p style="color:#8899BB;line-height:1.6;margin:0 0 24px">
      Você tem acesso completo ao Ascendia por 7 dias gratuitos. Aqui está o que fazer primeiro:
    </p>

    <div style="space-y:12px;margin:0 0 32px">
      ${[
        ['💪', 'Adicionar seus primeiros hábitos', '/habitos'],
        ['✅', 'Criar sua primeira tarefa', '/tarefas'],
        ['💰', 'Registrar uma transação', '/financas'],
        ['🤖', 'Conversar com o Coach IA', '/coach'],
      ].map(([icon, text, path]) => `
      <a href="${APP_URL}${path}" style="display:flex;align-items:center;gap:12px;background:#0D1829;border:1px solid rgba(255,77,0,0.2);border-radius:12px;padding:16px;text-decoration:none;color:#fff;margin-bottom:12px">
        <span style="font-size:24px">${icon}</span>
        <span style="font-weight:600">${text}</span>
        <span style="margin-left:auto;color:#FF4D00">→</span>
      </a>`).join('')}
    </div>

    <a href="${APP_URL}/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#FF4D00,#7C3AED);color:#fff;font-weight:700;font-size:16px;padding:16px 32px;border-radius:12px;text-decoration:none">
      Começar agora →
    </a>
  </div>
</body>
</html>`,
  })
}
