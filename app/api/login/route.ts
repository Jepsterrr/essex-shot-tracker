import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { loginSchema } from "@/lib/validations";
import {
  clearLoginFailures,
  getClientIp,
  getLoginLockSeconds,
  recordLoginFailure,
} from "@/lib/login-rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { password } = result.data;
    const session = await getSession();

    const ip = getClientIp(request);
    const lockSeconds = await getLoginLockSeconds(ip);
    if (lockSeconds > 0) {
      return NextResponse.json(
        { error: `För många felaktiga försök. Försök igen om ${Math.ceil(lockSeconds / 60)} min.` },
        { status: 429, headers: { "Retry-After": String(lockSeconds) } }
      );
    }

    const { data: configs } = await supabaseAdmin
      .from("app_config")
      .select("key, value")
      .in("key", ["admin_password_hash", "password_version"]);

    // ADMIN_PASSWORD_HASH är en reserv som bara gäller om databasen saknar hash,
    // annars skulle den kringgå ett lösenordsbyte
    const sitePasswordHash =
      configs?.find(c => c.key === "admin_password_hash")?.value ||
      process.env.ADMIN_PASSWORD_HASH;
    const currentVersion = configs?.find(c => c.key === "password_version")?.value || "1";

    if (!sitePasswordHash) {
      return NextResponse.json(
        { error: "Systemet är inte konfigurerat" },
        { status: 500 }
      );
    }

    const match = await bcrypt.compare(password.trim(), sitePasswordHash);

    if (match) {
      // Sätt datan i vår session
      session.isLoggedIn = true;
      session.passwordVersion = currentVersion;
      // Spara sessionen, detta krypterar och sätter kakan
      await session.save();
      await clearLoginFailures(ip);

      return NextResponse.json({ message: "Inloggad!" }, { status: 200 });
    }

    await recordLoginFailure(ip);
    return NextResponse.json({ error: "Ogiltigt lösenord" }, { status: 401 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
