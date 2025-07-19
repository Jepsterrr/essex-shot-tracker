import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  isLoggedIn: boolean;
}

// Konfiguration för vår session
export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_SECRET as string,
  cookieName: process.env.PASSWORD_COOKIE_NAME as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365 * 1.25, 
  },
};

// En hjälpfunktion för att enkelt hämta sessionen i server-komponenter och routes
export function getSession(): Promise<IronSession<SessionData>> {
  const session = getIronSession<SessionData>(cookies() as any, sessionOptions);
  return session;
}