/**
 * Webhook do Stripe — FitQuest
 *
 * Eventos tratados:
 * - checkout.session.completed   → ativa lifetime ou salva stripe_customer_id
 * - customer.subscription.created/updated → atualiza subscription_status
 * - customer.subscription.deleted → marca como expired
 * - invoice.payment_failed       → marca como expired
 *
 * API version: 2026-04-22.dahlia (Stripe SDK v22)
 * Invoice.subscription foi movido para Invoice.parent.subscription_details.subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('webhook signature error', err)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        const plan = session.metadata?.plan

        if (!userId || !plan) break

        if (session.mode === 'payment') {
          // Pagamento único — vitalício
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'lifetime',
              subscription_plan: 'lifetime',
              subscription_started_at: new Date().toISOString(),
              subscription_end: null,
              stripe_customer_id: String(session.customer ?? ''),
            })
            .eq('id', userId)
        } else {
          // Subscription — salva customer_id; status vem em customer.subscription.created
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: String(session.customer ?? '') })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        const plan = sub.metadata?.plan ?? 'monthly'

        if (!userId) break

        const status =
          sub.status === 'active' || sub.status === 'trialing'
            ? 'active'
            : sub.status === 'canceled'
              ? 'cancelled'
              : 'expired'

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_plan: plan,
            subscription_started_at: new Date(sub.start_date * 1000).toISOString(),
            subscription_end: sub.cancel_at
              ? new Date(sub.cancel_at * 1000).toISOString()
              : null,
            stripe_subscription_id: sub.id,
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) break

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'expired',
            subscription_end: new Date().toISOString(),
          })
          .eq('id', userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // API 2026-04-22.dahlia: subscription está em invoice.parent.subscription_details.subscription
        const subRef = invoice.parent?.subscription_details?.subscription
        if (!subRef) break

        const subId = typeof subRef === 'string' ? subRef : subRef.id
        const sub = await stripe.subscriptions.retrieve(subId)
        const userId = sub.metadata?.user_id
        if (!userId) break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('id', userId)
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('webhook processing error', err)
    return NextResponse.json({ error: 'processing_error' }, { status: 500 })
  }
}
