This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Essex Shot Tracker

Detta är en webbapplikation byggd med Next.js och Supabase för att hålla koll på straffshots inom en grupp. Applikationen tillåter användare att logga utdelade och konsumerade shots, se en aktuell ställning, och granska detaljerad historik.

## Funktioner
- Logga shots: Lägg till eller ta bort shots för en specifik medlem.

- Ställning: Se en översikt över alla medlemmars nuvarande skuld, uppdelat på grupperna KEX och ESS.

- Detaljerad historik: En komplett logg över alla händelser, med möjlighet till paginering.

- Personlig statistik: Varje medlem har en egen sida med detaljerad statistik över utdelade och avklarade shots.

- Adminpanel:

  Hantera medlemmar (lägg till, redigera, arkivera, radera).

  Hantera vittnen (lägg till, redigera, radera).

## Teknisk Översikt
- Framework: Next.js

- Styling: Tailwind CSS

- Backend & Databas: Supabase

- Språk: TypeScript

## Komma igång
För att köra projektet lokalt, följ dessa steg:

1. Klona repot
  ```bash
  git clone <[din-repo-url](https://github.com/Jepsterrr/essex-shot-tracker)>
  cd <repo-namn>
  ```
2. Installera beroenden
  ```bash
  npm install
  # eller
  yarn install
  # eller
  pnpm install
  ``` 
4. Sätt upp miljövariabler
   Skapa en fil vid namn .env.local i roten av projektet och lägg till dina Supabase-nycklar. Dessa hittar du i ditt Supabase-projekts inställningar under "API".
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=din-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=din-supabase-service-role-key
   ```
   SUPABASE_SERVICE_ROLE_KEY behövs för att hantera data säkert från serversidan via API-anropen.
6. Kör utvecklingsservern
   ```bash
   npm run dev
   # eller
   yarn dev
   # eller
   pnpm dev
   ```
   Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare för att se resultatet.
