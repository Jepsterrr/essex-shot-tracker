import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Samma admin-klient som tidigare
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST för att skapa en ny medlem
export async function POST(request: Request) {
  try {
    const { name, group_type } = await request.json();
    if (!name || !group_type) {
      return NextResponse.json({ error: 'Name and group type are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('members').insert({ name, group_type });

    if (error) {
      if (error.code === '23505') {
          return NextResponse.json({ error: 'A member with this name already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Member created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('members').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Member deleted' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, is_active } = await request.json();
    if (id === undefined || is_active === undefined) {
      return new Response(JSON.stringify({ error: 'ID and is_active status are required' }), { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('members')
      .update({ is_active: is_active })
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Member status updated' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, newName, newGroup } = await request.json();
    if (!id || !newName || !newGroup) {
      return new Response(JSON.stringify({ error: 'ID, newName, and newGroup are required' }), { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('members')
      .update({ name: newName, group_type: newGroup })
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Member updated' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}