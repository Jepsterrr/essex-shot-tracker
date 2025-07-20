import { supabase } from "@/lib/supabase-client";
import { getSession } from "@/lib/session";

// POST för att skapa ett nytt vittne
export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { name } = await request.json();
    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
      });
    }
    const { error } = await supabase.from("witnesses").insert({ name });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ message: "Witness created" }), {
      status: 201,
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
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
    const { error } = await supabase.from("witnesses").delete().eq("id", id);
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
        { status: 400 }
      );
    }
    const { error } = await supabase
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
