/**
 * Cron: snapshot diário de métricas
 * Executa às 01:00 UTC (22:00 Brasília) — após o dia fechar
 * Persiste em metrics_daily para o painel de analytics
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? ''}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const db = createServiceClient();

  // Dia de ontem (snapshot do dia fechado)
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const { error } = await db.rpc('snapshot_daily_metrics', { p_date: yesterday });

  if (error) {
    console.error('[metrics-snapshot] RPC error:', error);
    return NextResponse.json({ error: 'rpc_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, date: yesterday });
}
