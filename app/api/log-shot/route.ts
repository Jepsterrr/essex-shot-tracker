import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { logShotRequestSchema } from "@/lib/validations";
import { claimRequest, completeRequest, releaseRequest } from "@/lib/idempotency";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const result = logShotRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Felaktig data", details: result.error.format() },
        { status: 400 },
      );
    }

    const { member_ids, change, reason, witnesses, giver_ids, request_id } =
      result.data;

    // Samma request_id får bara loggas en gång (offline-kö och nätverksfel kan skicka om)
    if (request_id) {
      const claim = await claimRequest(request_id);
      if (!claim.claimed) {
        if (claim.status === "pending") {
          return NextResponse.json(
            { error: "Begäran behandlas redan" },
            { status: 503 },
          );
        }
        return NextResponse.json(
          { success: true, logIds: claim.logIds, duplicate: true },
          { status: 200 },
        );
      }
    }

    const { data: logIds, error } = await supabaseAdmin.rpc(
      "handle_new_shot_logs",
      {
        p_member_ids: member_ids,
        p_change_amount: change,
        p_reason_text: reason ?? "",
        p_witnesses_json: witnesses,
        p_giver_ids: giver_ids,
      },
    );

    if (error) {
      // Loggningen misslyckades, så nyckeln släpps och ett nytt försök får gå igenom
      if (request_id) await releaseRequest(request_id).catch(() => {});
      throw error;
    }

    // Shotsen är nu sparade: ett fel här får aldrig leda till 500 eller att nyckeln släpps,
    // eftersom klienten då skulle skicka om och logga dubbelt
    if (request_id) {
      await completeRequest(request_id, logIds ?? []).catch((err) =>
        console.error("Kunde inte markera begäran som klar:", err),
      );
    }

    return NextResponse.json(
      { success: true, logIds: logIds },
      { status: 200 },
    );
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
