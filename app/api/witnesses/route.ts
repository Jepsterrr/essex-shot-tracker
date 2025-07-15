import { createClient } from '@supabase/supabase-js'

// Samma admin-klient som tidigare
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST för att skapa ett nytt vittne
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }
    const { error } = await supabaseAdmin.from('witnesses').insert({ name });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Witness created' }), { status: 201 });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// DELETE för att ta bort ett vittne
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Witness ID is required' }), { status: 400 });
    }
    const { error } = await supabaseAdmin.from('witnesses').delete().eq('id', id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Witness deleted' }), { status: 200 });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

// PUT för att uppdatera ett befintligt vittne
export async function PUT(request: Request) {
  try {
    const { id, newName } = await request.json();
    if (!id || !newName) {
      return new Response(JSON.stringify({ error: 'ID and newName are required' }), { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from('witnesses')
      .update({ name: newName })
      .eq('id', id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Witness updated' }), { status: 200 });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}