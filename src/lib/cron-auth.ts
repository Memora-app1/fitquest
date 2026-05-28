import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Verifica autorização de cron jobs do Vercel.
 * Configure CRON_SECRET no painel do Vercel.
 * O Vercel envia: Authorization: Bearer <CRON_SECRET>
 *
 * Em desenvolvimento, a variável não é obrigatória.
 */
export async function isCronAuthorized(): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev: sem secret = sempre permitido

  const headersList = await headers()
  const auth = headersList.get('authorization')
  return auth === `Bearer ${secret}`
}

export function cronUnauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
