import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { loginSchema } from "@/lib/validations";

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

    // const sitePasswordHash = process.env.SITE_PASSWORD_HASH;

    //if (!sitePasswordHash) {
    //  console.error("Miljövariabeln SITE_PASSWORD_HASH är inte satt.");
    //  return NextResponse.json(
    //    { error: "Serverkonfigurationsfel" },
    //    { status: 500 }
    //  );
    //}

    const { data: configs } = await supabaseAdmin
      .from("app_config")
      .select("key, value")
      .in("key", ["admin_password_hash", "password_version"]);

    const sitePasswordHash = configs?.find(c => c.key === "admin_password_hash")?.value;
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

      return NextResponse.json({ message: "Inloggad!" }, { status: 200 });
    }

    return NextResponse.json({ error: "Ogiltigt lösenord" }, { status: 401 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
