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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.from("members").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Member deleted" }, { status: 200 });
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
    const result = z
      .object({ id: z.uuid(), is_active: z.boolean() })
      .safeParse(body);

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
    const { id, newName, newGroup } = await request.json();
    if (!id || !newName || !newGroup) {
      return new Response(
        JSON.stringify({ error: "ID, newName, and newGroup are required" }),
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("members")
      .update({ name: newName, group_type: newGroup })
      .eq("id", id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: "Member updated" }), {
      status: 200,
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
