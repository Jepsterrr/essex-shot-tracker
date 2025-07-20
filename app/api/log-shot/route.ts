import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { member_id, change, reason, witnesses, group_type, giver_ids } = body;

    if (!member_id || typeof change !== 'number' || !group_type) {
      return NextResponse.json({ error: 'member_id, change, and group_type are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.rpc('handle_new_shot_log', {
      member_uuid: member_id,
      change_amount: change,
      reason_text: reason,
      witnesses_json: witnesses,
      log_group_type: group_type,
      p_giver_ids: giver_ids
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