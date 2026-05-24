import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  _resend = new Resend(key)
  return _resend
}

const FROM = 'FitQuest <noreply@fitquest.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fitquest-app1.vercel.app'

export async function sendTrialEndingEmail(to: string, name: string, daysLeft: number) {
  const urgency = daysLeft <= 1 ? '🚨' : '⏰'
  const subject =
    daysLeft <= 1
      ? `${urgency} Seu trial FitQuest termina HOJE`
      : `${urgency} Seu trial FitQuest termina em ${daysLeft} dias`

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
      <h1 style="font-size:32px;font-weight:900;color:#FF4D00;letter-spacing:2px;margin:8px 0">FITQUEST</h1>
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
      FitQuest · <a href="${APP_URL}/privacidade" style="color:#FF4D00">Privacidade</a> · <a href="${APP_URL}/termos" style="color:#FF4D00">Termos</a>
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
    subject: `⚡ Bem-vindo ao FitQuest, ${name}!`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#050914;color:#fff;font-family:DM Sans,sans-serif;margin:0;padding:0">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:48px">⚡</span>
      <h1 style="font-size:32px;font-weight:900;color:#FF4D00;letter-spacing:2px;margin:8px 0">FITQUEST</h1>
    </div>

    <h2 style="font-size:22px;font-weight:700;margin:0 0 16px">Bem-vindo, ${name}! Seus 7 dias começaram. 🎉</h2>

    <p style="color:#8899BB;line-height:1.6;margin:0 0 24px">
      Você tem acesso completo ao FitQuest por 7 dias gratuitos. Aqui está o que fazer primeiro:
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
