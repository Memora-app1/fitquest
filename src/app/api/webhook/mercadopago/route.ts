/**
 * Webhook do Mercado Pago
 *
 * Recebe notificações de:
 * - preapproval (assinaturas mensais/anuais)
 * - payment (pagamento único do vitalício)
 *
 * 🔒 Verifica assinatura via x-signature header
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { mpClient } from '@/lib/mercadopago'
import { Payment, PreApproval } from 'mercadopago'
import { createHmac } from 'crypto'

function verifySignature(req: NextRequest, body: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) return true // se não configurado, aceita (dev)

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  if (!xSignature || !xRequestId) return false

  const parts = xSignature.split(',').reduce((acc, p) => {
    const [k, v] = p.trim().split('=')
    if (k && v) acc[k] = v
    return acc
  }, {} as Record<string, string>)

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const dataId = new URL(req.url).searchParams.get('data.id') ?? ''
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = createHmac('sha256', secret).update(manifest).digest('hex')
  return hmac === v1
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  if (!verifySignature(req, body)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  let data: { type?: string; data?: { id?: string }; action?: string }
  try {
    data = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    // Pagamento único (vitalício)
    if (data.type === 'payment' && data.data?.id) {
      const payment = await new Payment(mpClient).get({ id: data.data.id })

      if (payment.status === 'approved' && payment.external_reference) {
        const userId = payment.external_reference.match(/user_([^_]+)/)?.[1]
        if (userId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'lifetime',
              subscription_plan: 'lifetime',
              subscription_started_at: new Date().toISOString(),
              subscription_end: null,
            })
            .eq('id', userId)
        }
      }
    }

    // Assinatura recorrente
    if (data.type === 'preapproval' && data.data?.id) {
      const sub = await new PreApproval(mpClient).get({ id: data.data.id })

      if (sub.external_reference) {
        const userId = sub.external_reference.match(/user_([^_]+)/)?.[1]
        const plan = sub.external_reference.match(/plan_([^_]+)/)?.[1]

        if (userId && plan) {
          const status = sub.status === 'authorized' ? 'active' : sub.status === 'cancelled' ? 'cancelled' : 'expired'

          await supabase
            .from('profiles')
            .update({
              subscription_status: status,
              subscription_plan: plan,
              subscription_started_at: sub.date_created ?? new Date().toISOString(),
              mp_subscription_id: sub.id,
            })
            .eq('id', userId)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('webhook error', err)
    return NextResponse.json({ error: 'processing_error' }, { status: 500 })
  }
}
