import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { witnessSchema } from "@/lib/validations";

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "Witness ID is required" }), {
        status: 400,
      });
    }
    const { error } = await supabaseAdmin
      .from("witnesses")
      .delete()
      .eq("id", id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ message: "Witness deleted" }), {
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
    const { id, newName } = await request.json();
    if (!id || !newName) {
      return new Response(
        JSON.stringify({ error: "ID and newName are required" }),
        { status: 400 },
      );
    }
    const { error } = await supabaseAdmin
      .from("witnesses")
      .update({ name: newName })
      .eq("id", id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ message: "Witness updated" }), {
      status: 200,
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
