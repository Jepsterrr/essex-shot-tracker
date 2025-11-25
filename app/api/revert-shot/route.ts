import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session.isLoggedIn) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin.rpc("revert_shot_log", {
            target_log_id: id,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Händelse ångrad" }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}