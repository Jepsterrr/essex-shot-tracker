import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

interface Attempts {
  count: number;
  firstAt: number;
  lockedUntil: number;
}

const KEY_PREFIX = "login_fail:";
const keyFor = (ip: string) => `${KEY_PREFIX}${ip}`;

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

async function readAttempts(ip: string): Promise<Attempts | null> {
  const { data } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", keyFor(ip))
    .maybeSingle();
  if (!data) return null;
  try {
    return JSON.parse(data.value) as Attempts;
  } catch {
    return null;
  }
}

// Returnerar antal sekunder kvar av låsningen, eller 0 om inloggning är tillåten
export async function getLoginLockSeconds(ip: string): Promise<number> {
  const attempts = await readAttempts(ip);
  if (!attempts || attempts.lockedUntil <= Date.now()) return 0;
  return Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const now = Date.now();
  const previous = await readAttempts(ip);
  const inWindow = previous && now - previous.firstAt < WINDOW_MS;

  const count = inWindow ? previous.count + 1 : 1;
  const next: Attempts = {
    count,
    firstAt: inWindow ? previous.firstAt : now,
    lockedUntil: count >= MAX_FAILURES ? now + LOCK_MS : 0,
  };

  await supabaseAdmin
    .from("app_config")
    .upsert({ key: keyFor(ip), value: JSON.stringify(next) });

  await purgeExpiredAttempts();
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await supabaseAdmin.from("app_config").delete().eq("key", keyFor(ip));

  await purgeExpiredAttempts();
}

// Tar bort rader vars räknefönster har gått ut och som inte längre är låsta, så att
// app_config inte fylls på med gamla IP-adresser. Körs vid både fel och lyckad inloggning
// samt från cron-jobbet, och returnerar antal borttagna rader.
export async function purgeExpiredAttempts(): Promise<number> {
  try {
    const { data } = await supabaseAdmin
      .from("app_config")
      .select("key, value")
      .like("key", `${KEY_PREFIX}%`);

    const now = Date.now();
    const expired = (data ?? [])
      .filter((row) => {
        try {
          const attempts = JSON.parse(row.value) as Attempts;
          return now - attempts.firstAt >= WINDOW_MS && attempts.lockedUntil <= now;
        } catch {
          return true;
        }
      })
      .map((row) => row.key);

    if (expired.length > 0) {
      await supabaseAdmin.from("app_config").delete().in("key", expired);
    }
    return expired.length;
  } catch (err) {
    // Städningen är best effort och får aldrig stoppa en inloggning
    console.error("Login attempt purge failed:", err);
    return 0;
  }
}
