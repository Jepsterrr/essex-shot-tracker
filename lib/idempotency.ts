import { supabaseAdmin } from "@/lib/supabase-admin";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface IdemRecord {
  status: "pending" | "done";
  at: number;
  logIds?: string[];
}

const keyFor = (requestId: string) => `idem:${requestId}`;

export type ClaimResult =
  | { claimed: true }
  | { claimed: false; status: "pending" | "done"; logIds: string[] };

// Tar bort gamla nycklar så att app_config inte växer
async function purgeExpired(): Promise<void> {
  const { data } = await supabaseAdmin
    .from("app_config")
    .select("key, value")
    .like("key", "idem:%");

  const expired = (data ?? [])
    .filter((row) => {
      try {
        return Date.now() - (JSON.parse(row.value) as IdemRecord).at > TTL_MS;
      } catch {
        return true;
      }
    })
    .map((row) => row.key);

  if (expired.length > 0) {
    await supabaseAdmin.from("app_config").delete().in("key", expired);
  }
}

// Primärnyckeln på app_config gör anspråket atomiskt: bara en request kan sätta nyckeln
export async function claimRequest(requestId: string): Promise<ClaimResult> {
  const record: IdemRecord = { status: "pending", at: Date.now() };
  const { error } = await supabaseAdmin
    .from("app_config")
    .insert({ key: keyFor(requestId), value: JSON.stringify(record) });

  if (!error) {
    purgeExpired().catch((err) => console.error("Idempotency purge failed:", err));
    return { claimed: true };
  }
  if (error.code !== "23505") throw error;

  const { data } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", keyFor(requestId))
    .maybeSingle();

  try {
    const existing = JSON.parse(data?.value ?? "") as IdemRecord;
    return { claimed: false, status: existing.status, logIds: existing.logIds ?? [] };
  } catch {
    return { claimed: false, status: "pending", logIds: [] };
  }
}

export async function completeRequest(requestId: string, logIds: string[]): Promise<void> {
  const record: IdemRecord = { status: "done", at: Date.now(), logIds };
  await supabaseAdmin
    .from("app_config")
    .update({ value: JSON.stringify(record) })
    .eq("key", keyFor(requestId));
}

// Släpper anspråket om loggningen misslyckades så att ett nytt försök kan gå igenom
export async function releaseRequest(requestId: string): Promise<void> {
  await supabaseAdmin.from("app_config").delete().eq("key", keyFor(requestId));
}
