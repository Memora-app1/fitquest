/**
 * Cron a cada 2h — sincroniza eventos do Google Calendar
 *
 * 📌 TODO: implementar quando configurar OAuth do Google
 */

import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET() {
  // Placeholder — implementar após setup do Google OAuth
  return NextResponse.json({ ok: true, note: 'calendar-sync not implemented yet' })
}
