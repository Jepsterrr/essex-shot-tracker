import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import bcrypt from "bcrypt";
import { changePasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { newPassword } = result.data;
    const hashedNewPassword = await bcrypt.hash(newPassword.trim(), 12);
    const newVersion = Date.now().toString();

    // Supabase (Source of Truth)
    await supabaseAdmin.from("app_config").upsert([
      { key: "admin_password_hash", value: hashedNewPassword },
      { key: "password_version", value: newVersion },
    ]);

    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const vercelToken = process.env.VERCEL_ACCESS_TOKEN;

    if (edgeConfigId && vercelToken) {
      await fetch(
        `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                operation: 'upsert',
                key: 'password_version',
                value: newVersion,
              },
            ],
          }),
        }
      );
    }

    return NextResponse.json({ message: "Lösenordet har uppdaterats!" });
  } catch (err) {
    return NextResponse.json(
      { error: "Kunde inte spara lösenordet" },
      { status: 500 }
    );
  }
}
