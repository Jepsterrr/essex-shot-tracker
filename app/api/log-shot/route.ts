import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Viktigt! Denna klient använder service_role key för att kunna anropa databasfunktioner säkert från servern.
// Denna key ska ALDRIG exponeras i klienten/webbläsaren.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Lägg till denna i din .env.local fil. Du hittar den i Supabase > Project Settings > API.
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { member_id, change, reason, witnesses } = body;

    // Validering
    if (!member_id || typeof change !== 'number') {
      return NextResponse.json({ error: 'member_id and change are required' }, { status: 400 });
    }

    // Anropa vår säkra Postgres-funktion
    const { error } = await supabaseAdmin.rpc('handle_new_shot_log', {
      member_uuid: member_id,
      change_amount: change,
      reason_text: reason,
      witnesses_json: witnesses,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Shot log created successfully' }, { status: 200 });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}