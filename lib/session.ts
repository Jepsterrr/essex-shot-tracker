import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { get } from "@vercel/edge-config";

export interface SessionData {
  isLoggedIn: boolean;
  passwordVersion: string;
}

// Konfiguration för vår session
export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_SECRET as string,
  cookieName: process.env.PASSWORD_COOKIE_NAME as string,
  ttl: 60 * 60 * 24 * 365 * 1.25,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 1.25,
  },
};

// En hjälpfunktion för att enkelt hämta sessionen i server-komponenter och routes
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

// API-rutter ligger utanför middleware, så sessionens lösenordsversion måste kontrolleras här
// på samma sätt som i middleware. Annars förblir gamla cookies giltiga efter lösenordsbyte.
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  if (!session.isLoggedIn) return false;

  const latestPasswordVersion = await get<string>("password_version");
  if (latestPasswordVersion && session.passwordVersion !== latestPasswordVersion) {
    return false;
  }
  return true;
}
