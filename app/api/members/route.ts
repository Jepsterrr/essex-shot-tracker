import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { memberSchema } from "@/lib/validations";
import { z } from "zod";

// POST för att skapa en ny medlem
export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    // Vi plockar ut name och group_type från memberSchema för validering
    const body = await request.json();
    const result = memberSchema
      .pick({ name: true, group_type: true })
      .safeParse(body);

    if (!result.success)
      return NextResponse.json(
        { error: "Namn och grupp krävs" },
        { status: 400 },
      );

    const { error } = await supabaseAdmin.from("members").insert(result.data);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Medlem skapad" }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const id = new URL(request.url).searchParams.get("id");
    const idResult = z.uuid().safeParse(id);

    if (!idResult.success)
      return NextResponse.json({ error: "Ogiltigt ID" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("members")
      .delete()
      .eq("id", idResult.data);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Medlem raderad" }, { status: 200 });
  } catch (_err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const result = memberSchema.pick({ id: true, is_active: true }).safeParse(body);

    if (!result.success)
      return NextResponse.json({ error: "Ogiltig data" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("members")
      .update({ is_active: result.data.is_active })
      .eq("id", result.data.id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Status uppdaterad" });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const result = memberSchema.pick({ id: true, name: true, group_type: true }).safeParse(body);

    if (!result.success) return NextResponse.json({ error: "Namn och grupp krävs" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("members")
      .update({ name: result.data.name, group_type: result.data.group_type })
      .eq("id", result.data.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: "Medlem uppdaterad" }), {
      status: 200,
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
