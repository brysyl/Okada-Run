// Supabase Edge Function (Deno). Not executable under Node; all scoring logic lives in validate.ts (vitest).
// Deploy: supabase functions deploy submit-score
import { createClient } from 'npm:@supabase/supabase-js@2';
import { validateSubmission } from './validate.ts';

const MAX_BODY_BYTES = 2048;
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const RATE_LIMIT = Math.max(1, Number(Deno.env.get('SCORE_RATE_LIMIT_PER_MINUTE') ?? '5') || 5);
const IP_HASH_SALT = Deno.env.get('IP_HASH_SALT') ?? '';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

async function hashIp(req: Request): Promise<string> {
  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const data = new TextEncoder().encode(`${IP_HASH_SALT}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { ok: false, reason: 'method_not_allowed' });

  // Enforce the size limit on bytes actually read, not on the Content-Length header.
  const raw = new Uint8Array(await req.arrayBuffer());
  if (raw.byteLength > MAX_BODY_BYTES) return json(413, { ok: false, reason: 'body_too_large' });
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return json(400, { ok: false, reason: 'invalid_body' });
  }

  // Only the validated fields are used; client-supplied id/created_at are ignored.
  const result = validateSubmission(body);
  if (!result.ok) return json(400, { ok: false, reason: result.reason });
  const v = result.value;

  try {
    const ipHash = await hashIp(req);
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count, error: countError } = await supabase
      .from('score_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);
    if (countError) throw countError;
    if ((count ?? 0) >= RATE_LIMIT) return json(429, { ok: false, reason: 'rate_limited' });

    const { error: logError } = await supabase.from('score_submissions').insert({ ip_hash: ipHash });
    if (logError) throw logError;

    const { error } = await supabase.from('leaderboard').insert({
      name: v.name,
      score: v.score,
      coins: v.coins,
      distance: v.distance,
      duration_s: v.durationS,
      max_speed: v.maxSpeed,
      nitro_uses: v.nitroUses,
    });
    if (error) throw error;
    return json(200, { ok: true });
  } catch (err) {
    console.error('[submit-score] failed', err);
    return json(500, { ok: false, reason: 'server_error' });
  }
});
