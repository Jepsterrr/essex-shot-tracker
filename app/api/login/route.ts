import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { password } = body;

    const sitePassword = process.env.SITE_PASSWORD;

    if (!sitePassword) {
      console.error('Miljövariabeln SITE_PASSWORD är inte satt.');
      return NextResponse.json({ error: 'Serverkonfigurationsfel' }, { status: 500 });
    }

    if (password === sitePassword) {
      // Sätt datan i vår session
      session.isLoggedIn = true;
      // Spara sessionen, detta krypterar och sätter kakan
      await session.save();
      
      return NextResponse.json({ message: 'Inloggad!' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Ogiltigt lösenord' }, { status: 401 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}