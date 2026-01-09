import { NextResponse, NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./lib/session";
import { supabase } from "./lib/supabase-client";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Måste använda 'edge'-versionen av getIronSession i middleware
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  if (session.isLoggedIn && !isLoginPage) {
    // Hämta den globala versionen från DB
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "password_version")
      .single();

    // Om versionen i kakan är gammal, logga ut
    if (!error && data?.value && session.passwordVersion !== data.value) {
      session.isLoggedIn = false;
      session.passwordVersion = "";
      
      session.destroy();
      const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
      const destroyedSession = await getIronSession<SessionData>(request, redirectResponse, sessionOptions);
      destroyedSession.destroy();
      return redirectResponse;
    }
  }

  if (!session.isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
