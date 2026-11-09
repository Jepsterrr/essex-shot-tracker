import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { purgeExpiredRequests } from "@/lib/idempotency";
import { purgeExpiredAttempts } from "@/lib/login-rate-limit";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { error } = await supabaseAdmin
      .from("members")
      .select("id",)
      .limit(1);

    if (error) throw error;

    // Städa gamla nycklar i app_config. Ett fel här ska inte få själva keep-alive att misslyckas.
    let purgedRequests = 0;
    let purgedLoginAttempts = 0;
    try {
      purgedRequests = await purgeExpiredRequests();
    } catch (purgeErr) {
      console.error("Idempotency purge failed:", purgeErr);
    }
    purgedLoginAttempts = await purgeExpiredAttempts();

    return NextResponse.json({
      success: true,
      message: "Supabase is awake",
      purged: { idempotencyKeys: purgedRequests, loginAttempts: purgedLoginAttempts },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
