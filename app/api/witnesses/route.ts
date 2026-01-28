import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { witnessSchema } from "@/lib/validations";
import { z } from "zod";

// POST för att skapa ett nytt vittne
export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const result = witnessSchema.pick({ name: true }).safeParse(body);

    if (!result.success)
      return NextResponse.json({ error: "Namn krävs" }, { status: 400 });

    const { error } = await supabaseAdmin.from("witnesses").insert(result.data);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Vittne skapat" }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE för att ta bort ett vittne
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
      .from("witnesses")
      .delete()
      .eq("id", idResult.data);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ message: "Vittne raderat" }), {
      status: 200,
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// PUT för att uppdatera ett befintligt vittne
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const result = witnessSchema.pick({ id: true, name: true }).safeParse(body);

    if (!result.success)
      return NextResponse.json({ error: "ID och namn krävs" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("witnesses")
      .update({ name: result.data.name })
      .eq("id", result.data.id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ message: "Vittne uppdaterat" }), {
      status: 200,
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
