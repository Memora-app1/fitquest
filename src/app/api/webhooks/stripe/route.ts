import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Mapeia status Stripe → status Ascendia
function stripeStatusToApp(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':    return 'active'
    case 'trialing':  return 'trial'
    case 'canceled':  return 'expired'
    case 'past_due':
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':    return 'expired'
    default:          return 'expired'
  }
}

// Extrai plan a partir do price ID
function planFromPriceId(priceId: string): string {
  const monthly  = process.env.STRIPE_PRICE_MONTHLY
  const annual   = process.env.STRIPE_PRICE_ANNUAL
  const lifetime = process.env.STRIPE_PRICE_LIFETIME
  if (priceId === monthly)  return 'monthly'
  if (priceId === annual)   return 'annual'
  if (priceId === lifetime) return 'lifetime'
  return 'monthly'
}

// Em Stripe v22, current_period_end ficou no SubscriptionItem, não na Subscription
function getSubEndDate(sub: Stripe.Subscription): string | null {
  const periodEnd = sub.items.data[0]?.current_period_end
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
}

// Em Stripe v22, invoice.subscription moveu para invoice.parent.subscription_details.subscription
function getInvoiceSubId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent
  if (!parent) return null
  const details = parent.subscription_details
  if (!details) return null
  const sub = details.subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''
  const secret    = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    console.error('Stripe webhook signature invalid', err)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      // ── Checkout concluído ──────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.user_id ?? session.client_reference_id
        if (!userId) break

        if (session.mode === 'payment') {
          // Pagamento único — vitalício
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'lifetime',
              subscription_plan:   'lifetime',
              subscription_end:    null,
              stripe_customer_id:  String(session.customer ?? ''),
            })
            .eq('id', userId)
        } else if (session.mode === 'subscription') {
          // Registra customer_id — subscription será atualizada via subscription.updated
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: String(session.customer ?? '') })
            .eq('id', userId)
        }
        break
      }

      // ── Subscription criada ou atualizada ──────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) break

        const item    = sub.items.data[0]
        const priceId = item?.price?.id ?? ''
        const plan    = planFromPriceId(priceId)
        const status  = stripeStatusToApp(sub.status)
        const endDate = getSubEndDate(sub)

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_plan:   plan,
            subscription_end:    endDate,
          })
          .eq('id', userId)
        break
      }

      // ── Subscription cancelada/expirada ───────────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) break

        // Mantém acesso até o fim do período já pago
        const endDate = getSubEndDate(sub) ?? new Date().toISOString()

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_end:    endDate,
          })
          .eq('id', userId)
        break
      }

      // ── Pagamento da fatura bem-sucedido (renovação) ──────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = getInvoiceSubId(invoice)
        if (!subId) break

        const sub    = await getStripe().subscriptions.retrieve(subId)
        const userId = sub.metadata?.user_id
        if (!userId) break

        const item    = sub.items.data[0]
        const priceId = item?.price?.id ?? ''
        const plan    = planFromPriceId(priceId)
        const endDate = getSubEndDate(sub)

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_plan:   plan,
            subscription_end:    endDate,
          })
          .eq('id', userId)
        break
      }

      // ── Pagamento da fatura falhou ────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = getInvoiceSubId(invoice)
        if (!subId) break

        const sub    = await getStripe().subscriptions.retrieve(subId)
        const userId = sub.metadata?.user_id
        if (!userId) break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('id', userId)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Stripe webhook handler error', event.type, err)
    return NextResponse.json({ error: 'handler_error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
