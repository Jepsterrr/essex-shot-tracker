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

    const { member_ids, change, reason, witnesses, giver_ids } =
      result.data;

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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
