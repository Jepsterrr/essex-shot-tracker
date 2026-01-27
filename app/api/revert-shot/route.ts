import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { z } from "zod";

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session.isLoggedIn) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }
    
    const { searchParams } = new URL(request.url);
    const id = z.uuid().safeParse(searchParams.get("id"));

    if (!id.success) {
        return NextResponse.json({ error: "Ogiltigt Log ID" }, { status: 400 });
    }

    try {
        const { error } = await supabaseAdmin.rpc("revert_shot_log", {
            target_log_id: id.data,
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ message: "Händelse ångrad" });
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
