import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { password } = body;

    const sitePasswordHash = process.env.SITE_PASSWORD_HASH;

    console.log("Inskickat lösenord:", password);
    console.log("Hash från .env-fil:", sitePasswordHash);

    if (!sitePasswordHash) {
      console.error("Miljövariabeln SITE_PASSWORD_HASH är inte satt.");
      return NextResponse.json(
        { error: "Serverkonfigurationsfel" },
        { status: 500 }
      );
    }

    const match = await bcrypt.compare(password, sitePasswordHash);
    console.log("Matchar lösenordet?", match);

    if (match) {
      // Sätt datan i vår session
      session.isLoggedIn = true;
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
