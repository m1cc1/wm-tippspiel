# 🏆 WM 2026 Tippspiel

**FIFA World Cup 2026 – Real-time prediction game**  
Live leaderboard · Automatic score sync · Supabase + Next.js

---

## What you get

- **Register / Login** – each participant creates an account
- **Predict games** – enter a score before each kickoff
- **Live leaderboard** – updates in real-time as scores change
- **Automatic score sync** – scores pulled from football-data.org every minute
- **Points system** – 3 pts exact score · 1 pt correct winner · 0 pts wrong

---

## One-time setup (~30 minutes)

### Step 1 – Create a Supabase project (free)

1. Go to **https://supabase.com** and create a free account
2. Click **New Project**, choose a name (e.g. `wm-tippspiel`) and a strong password
3. Wait ~2 minutes for the project to spin up
4. Go to **Settings → API**, copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon/public** key (long string starting with `eyJ...`)

### Step 2 – Set up the database

1. In Supabase, click **SQL Editor → New Query**
2. Open the file `supabase/setup.sql` from this project
3. Copy the entire contents and paste into the SQL editor
4. Click **Run**  
   ✅ You should see "Success – no rows returned"

### Step 3 – Get a free API key for live scores

1. Go to **https://www.football-data.org/client/register**
2. Register for a free account (takes 2 minutes)
3. Your API key will be emailed to you immediately
4. The free plan covers the World Cup ✓

### Step 4 – Deploy to Vercel (free)

1. Go to **https://vercel.com** and create a free account
2. Click **Add New → Project**
3. Choose **"Upload"** and drag-and-drop this entire project folder  
   *(or connect your GitHub if you push the code there)*
4. Before clicking Deploy, click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
| `FOOTBALL_DATA_API_KEY` | your football-data.org key |
| `CRON_SECRET` | any random string, e.g. `mysecret123` |

5. Click **Deploy** – Vercel builds and hosts everything automatically
6. After deploy, go to **Settings → Cron Jobs** and add the header:
   - Header name: `x-cron-secret`
   - Header value: the same value you set for `CRON_SECRET`

### Step 5 – Add games to the schedule

The easiest way is via the Supabase Table Editor:

1. In Supabase → **Table Editor → games**
2. Click **Insert row** for each World Cup game
3. Fill in: `home_team`, `away_team`, `kickoff` (datetime), `group_stage`, and the `external_id` from football-data.org

Once the tournament starts, scores will update automatically every minute! 🎉

---

## Local development (optional)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.local.example .env.local
# Then fill in your Supabase + API keys

# 3. Run locally
npm run dev
# Open http://localhost:3000
```

---

## Project structure

```
wm-tippspiel/
├── app/
│   ├── page.tsx              # Landing page
│   ├── register/page.tsx     # Sign up
│   ├── login/page.tsx        # Sign in
│   ├── dashboard/page.tsx    # My stats
│   ├── games/page.tsx        # All games + tip input
│   ├── leaderboard/page.tsx  # Live leaderboard ⭐
│   └── api/scores/route.ts   # Cron: pulls live scores
├── components/
│   └── Navbar.tsx
├── lib/
│   ├── supabase.ts           # DB client
│   ├── scoring.ts            # Points logic
│   └── types.ts              # TypeScript types
├── supabase/
│   └── setup.sql             # ← Run this in Supabase SQL Editor
├── .env.local.example        # ← Copy to .env.local and fill in keys
└── vercel.json               # Cron job: sync scores every minute
```

---

## How the live leaderboard works

1. `vercel.json` triggers `/api/scores` every minute via Vercel Cron
2. The API route fetches live match data from football-data.org
3. It updates `games.home_score / away_score / status` in Supabase
4. Supabase Realtime broadcasts the change to all open browser tabs
5. The leaderboard page re-fetches the `get_leaderboard()` SQL function
6. The function includes **live delta** – points from still-running games are shown immediately, before the game ends

---

## Optional: Turn it into a mobile app

Once deployed, use [Capacitor](https://capacitorjs.com/) to wrap it into a native iOS/Android app:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init
npx cap add ios
npx cap add android
# Build the web app, then:
npx cap sync
npx cap open ios   # Opens in Xcode
```

---

## Troubleshooting

**Scores not updating?**
- Check that `FOOTBALL_DATA_API_KEY` is set correctly in Vercel
- Check Vercel → Functions → Cron logs for errors
- The World Cup 2026 competition ID may differ from the default `2000` in `api/scores/route.ts` – check football-data.org for the correct ID

**Login not working?**
- In Supabase → Authentication → URL Configuration, add your Vercel domain to "Site URL" and "Redirect URLs"

**Leaderboard not live-updating?**
- Make sure Realtime is enabled: Supabase → Database → Replication → check `tips` and `games` tables are toggled on

---

*Built with Next.js 14, Supabase, Tailwind CSS, and football-data.org*
