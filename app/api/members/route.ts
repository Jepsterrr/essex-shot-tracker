import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// POST för att skapa en ny medlem
export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { name, group_type } = await request.json();
    if (!name || !group_type) {
      return NextResponse.json(
        { error: "Name and group type are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("members")
      .insert({ name, group_type });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A member with this name already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Member created" }, { status: 201 });
  } catch (_err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Member deleted" }, { status: 200 });
  } catch (_err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
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
    const { id, is_active } = await request.json();
    if (id === undefined || is_active === undefined) {
      return new Response(
        JSON.stringify({ error: "ID and is_active status are required" }),
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("members")
      .update({ is_active: is_active })
      .eq("id", id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: "Member status updated" }), {
      status: 200,
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
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
        { status: 400 }
      );
    }

    const { error } = await supabase
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
