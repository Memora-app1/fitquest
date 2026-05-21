/**
 * Wrapper do Mercado Pago para FitQuest
 *
 * Suporta 3 fluxos:
 * 1. Subscription mensal (preapproval)
 * 2. Subscription anual (preapproval com frequency=12 months)
 * 3. Checkout Pro vitalício (pagamento único)
 */

import { MercadoPagoConfig, Preference, PreApproval } from 'mercadopago'

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

export const PRICING = {
  monthly: { amount: 37.0, label: 'FitQuest Mensal', frequency: 1, frequency_type: 'months' as const },
  annual: { amount: 306.6, label: 'FitQuest Anual', frequency: 12, frequency_type: 'months' as const },
  lifetime: { amount: 597.0, label: 'FitQuest Vitalício' },
} as const

/**
 * Cria uma subscription (preapproval) recorrente
 */
export async function createSubscription(opts: {
  plan: 'monthly' | 'annual'
  payerEmail: string
  externalReference: string
  backUrl: string
}) {
  const preapproval = new PreApproval(mpClient)
  const p = PRICING[opts.plan]

  return preapproval.create({
    body: {
      reason: p.label,
      external_reference: opts.externalReference,
      payer_email: opts.payerEmail,
      back_url: opts.backUrl,
      auto_recurring: {
        frequency: p.frequency,
        frequency_type: p.frequency_type,
        transaction_amount: p.amount,
        currency_id: 'BRL',
      },
      status: 'pending',
    },
  })
}

/**
 * Cria um Checkout Pro para pagamento único (vitalício)
 */
export async function createLifetimeCheckout(opts: {
  payerEmail: string
  externalReference: string
  backUrl: string
  notificationUrl: string
}) {
  const preference = new Preference(mpClient)

  return preference.create({
    body: {
      items: [
        {
          id: 'fitquest-lifetime',
          title: PRICING.lifetime.label,
          quantity: 1,
          unit_price: PRICING.lifetime.amount,
          currency_id: 'BRL',
        },
      ],
      payer: { email: opts.payerEmail },
      external_reference: opts.externalReference,
      back_urls: {
        success: `${opts.backUrl}?status=success`,
        failure: `${opts.backUrl}?status=failure`,
        pending: `${opts.backUrl}?status=pending`,
      },
      auto_return: 'approved',
      notification_url: opts.notificationUrl,
    },
  })
}
