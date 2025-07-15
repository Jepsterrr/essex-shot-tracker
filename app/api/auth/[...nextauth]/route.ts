import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

// Initiera Supabase-klienten för att kunna kommunicera med databasen
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Definiera alla konfigurationsalternativ för NextAuth
export const authOptions: AuthOptions = {
  providers: [
    // Vi använder "Credentials" för en klassisk inloggning med användarnamn och lösenord
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Användarnamn", type: "text" },
        password: { label: "Lösenord", type: "password" }
      },
      
      // Denna funktion körs när en användare försöker logga in
      async authorize(credentials) {
        console.log("\n--- NYTT INLOGGNINGSFÖRSÖK ---");

        // 1. Kontrollera inkommande data från formuläret
        if (!credentials?.username || !credentials?.password) {
            console.error("FEL: Användarnamn eller lösenord saknas i anropet.");
            return null;
        }
        console.log(`[STEG 1] Data från formulär mottagen: Användare: "${credentials.username}", Lösenord: "${credentials.password}"`);

        // 2. Försök hämta användaren från Supabase
        console.log(`[STEG 2] Försöker hämta användare "${credentials.username}" från Supabase...`);
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', credentials.username.trim()) // .trim() för att ta bort eventuella osynliga mellanslag
            .single();

        // 3. Analysera resultatet från databasen
        if (error) {
            console.error(`[STEG 3] FEL: Ett Supabase-fel uppstod:`, error.message);
            return null;
        }
        if (!user) {
            console.error(`[STEG 3] FEL: Ingen användare med namnet "${credentials.username}" hittades i databasen.`);
            return null;
        }
        console.log(`[STEG 3] Användare hittad. ID: ${user.id}, Användarnamn: ${user.username}`);
        
        // 4. Visa exakt vilken hash som hämtades
        console.log(`[STEG 4] Hash från databasen för denna användare är: "${user.password}"`);

        // 5. Jämför lösenordet med hashen
        console.log(`[STEG 5] Jämför nu lösenordet från formuläret med hashen...`);
        const passwordsMatch = await bcrypt.compare(credentials.password, user.password);

        // 6. Visa resultatet av jämförelsen
        if (passwordsMatch) {
            console.log(`[STEG 6] SUCCÉ: Lösenorden matchar! Returnerar användarobjekt.`);
            console.log("------------------------------------\n");
            return { id: user.id, username: user.username };
        } else {
            console.error(`[STEG 6] FEL: Lösenorden matchar INTE.`);
            console.log("------------------------------------\n");
            return null;
        }
      }
    })
  ],

  // Callbacks körs efter en lyckad "authorize" för att skapa sessionen
  callbacks: {
    // 'jwt'-callbacken skapar och uppdaterar JSON Web Token
    jwt({ token, user }) {
      // Om 'user'-objektet finns (skickas från 'authorize' vid inloggning),
      // lägg till dess information i token.
      if (user) {
        token.username = user.username;
        // token.sub är standardfältet för användarens ID
      }
      return token;
    },

    // 'session'-callbacken skapar sessionen som blir tillgänglig i klient-komponenter
    session({ session, token }) {
      // Överför informationen från vår anpassade token till session.user-objektet
      if (session.user) {
        session.user.username = token.username;
        session.user.id = token.sub!; // 'token.sub' innehåller användarens ID
      }
      return session;
    },
  },

  // Specificera vilken sida som ska visas för inloggning
  pages: {
    signIn: '/login',
  },

  // Använd JWT (JSON Web Tokens) som strategi för sessioner
  session: {
    strategy: "jwt",
  },

  // Din hemliga nyckel för att signera tokens
  secret: process.env.NEXTAUTH_SECRET,
};

// Skapa och exportera NextAuth-hanteraren
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };