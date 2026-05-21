import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSubscription, createLifetimeCheckout } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const formData = await req.formData()
  const plan = String(formData.get('plan') ?? '')

  if (!['monthly', 'annual', 'lifetime'].includes(plan)) {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const externalRef = `user_${user.id}_plan_${plan}_${Date.now()}`

  try {
    if (plan === 'lifetime') {
      const checkout = await createLifetimeCheckout({
        payerEmail: user.email!,
        externalReference: externalRef,
        backUrl: `${appUrl}/dashboard`,
        notificationUrl: `${appUrl}/api/webhook/mercadopago`,
      })
      return NextResponse.redirect(checkout.init_point ?? `${appUrl}/planos`)
    }

    const subscription = await createSubscription({
      plan: plan as 'monthly' | 'annual',
      payerEmail: user.email!,
      externalReference: externalRef,
      backUrl: `${appUrl}/dashboard`,
    })

    return NextResponse.redirect(subscription.init_point ?? `${appUrl}/planos`)
  } catch (err) {
    console.error('checkout error', err)
    return NextResponse.redirect(new URL('/planos?error=checkout', req.url))
  }
}
