import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from './lib/session'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Måste använda 'edge'-versionen av getIronSession i middleware
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    const { isLoggedIn } = session
    const loginUrl = new URL('/login', request.url)

    if (!isLoggedIn && request.nextUrl.pathname !== '/login') {
        return NextResponse.redirect(loginUrl)
    }

    if (isLoggedIn && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\..*).*)',
  ],
};