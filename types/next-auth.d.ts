import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Utöka JWT-typen med vårt anpassade fält
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    username: string;
  }
}

// Utöka Session-typen med vårt anpassade fält i user-objektet
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
    } & DefaultSession["user"];
  }

  // Utöka User-typen för att matcha det vi returnerar från authorize-funktionen
  interface User extends DefaultUser {
    username: string;
  }
}