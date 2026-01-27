# Essex Shot Tracker

![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

En modern Progressive Web App (PWA) byggd för att hålla koll på straffshots inom Essex. Applikationen är byggd med "Offline-first"-tänk, vilket gör att den fungerar utmärkt även på sittningar och fester med dålig mottagning.

## Funktioner

### Användarupplevelse
* **PWA & Offline-stöd:** Installera appen på hemskärmen. Händelser (shots/straff) som registreras offline sparas i en kö och synkas automatiskt när nätverket kommer tillbaka.
* **Realtidsuppdateringar:** Saldon och historik uppdateras direkt på alla enheter via Supabase Realtime utan att sidan behöver laddas om.
* **Optimistiskt UI:** Gränssnittet reagerar omedelbart på klick för en snabb känsla, medan data sparas i bakgrunden.

### Funktionalitet
* **Logga händelser:** Dela ut straff eller registrera avklarade shots (enskilt eller massbestraffning).
* **Topplistor & Statistik:**
    * Aktuell ställning ("Skulden").
    * Uppdelning mellan KEX och ESS.
    * Topplistor för "Mest straffade", "Flitigaste drickaren", och "Strängaste domaren".
* **Spelhall (Arcade):** Integrerade spel för att avgöra nästa shot:
    * **Blackjack:** Klassiskt kortspel mot dealern.
    * **Hot Phone:** En digital variant av "heta potaten".
    * **Unlucky Wheel:** Lyckohjul för att slumpa fram straff.
    * **Dice & Shithead/Vändtia:** Tärningsspel och Skitgubbe/Vändtia.
* **Detaljerad Historik:** Sökbar och paginerad logg över alla händelser.
* **Personlig Profil:** Klicka på en medlem för att se deras specifika historik och statistik.

### Admin & Hantering
* **Medlemshantering:** Lägg till, redigera, arkivera eller radera medlemmar
* **Vittneshantering:** Hantera listan över externa vittnen.
* **Lösenordsbyte:** Byt lösenord för hemsidan och förgående inloggade loggas ut.
* **Säkerhet & Åtkomst:** Hela applikationen är skyddad av ett gemensamt lösenord via `iron-session`.

## Teknisk Översikt

* **Frontend:** [Next.js](https://nextjs.org/) (App Router)
* **Språk:** TypeScript
* **Styling:** Tailwind CSS + Headless UI
* **Backend / Databas:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Statemanagement:** React Hooks & LocalStorage (för offline-kö)
* **Monitorering:** Vercel Analytics & Speed Insights för prestandamätning

## Projektstruktur

```text
/app         # Next.js App Router (Sidor och API-routes)
/components  # Återanvändbara UI-komponenter
/hooks       # Custom hooks för offline-logik och data
/lib         # Hjälpfunktioner, sessioner och Supabase-konfig
/public      # Bilder, manifest och PWA-ikoner
/types       # Delade TypeScript-definitioner
```


## Komma igång
För att köra projektet lokalt, följ dessa steg:

1. Klona repot
  ```bash
  git clone https://github.com/Jepsterrr/essex-shot-tracker.git
  cd essex-shot-tracker
  ```
2. Installera beroenden
  ```bash
  npm install
  # eller
  yarn install
  # eller
  pnpm install
  ``` 
3. Sätt upp miljövariabler

Skapa en fil vid namn .env i roten av projektet och lägg till dina Supabase-nycklar. Dessa hittar du i ditt Supabase-projekts inställningar under "API".
```bash
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=din-supabase-service-role-key

EDGE_CONFIG=din-edge-config-url
EDGE_CONFIG_ID=din-edge-config-id
VERCEL_ACCESS_TOKEN=din-vercel-access-token

IRON_SESSION_SECRET=din-iron-session-secret
SITE_PASSWORD_HASH=ditt-hashade-lösenord
PASSWORD_COOKIE_NAME=ditt-cookie-namn
```
SUPABASE_SERVICE_ROLE_KEY behövs för att hantera data säkert från serversidan via API-anropen.

4. Kör utvecklingsservern
```bash
npm run dev
# eller
yarn dev
# eller
pnpm dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare för att se resultatet.
