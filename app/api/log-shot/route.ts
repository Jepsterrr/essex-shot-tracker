import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { logShotRequestSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
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

    const { member_id, change, reason, witnesses, group_type, giver_ids } =
      result.data;

    const { error } = await supabaseAdmin.rpc("handle_new_shot_log", {
      member_uuid: member_id,
      change_amount: change,
      reason_text: reason,
      witnesses_json: witnesses,
      log_group_type: group_type,
      p_giver_ids: giver_ids,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: latestLog } = await supabaseAdmin
      .from("shot_log")
      .select("id")
      .eq("member_id", member_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json(
      { success: true, logId: latestLog?.id },
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
