# Deploy Workbench0 demo (Vercel + Railway)

Workbench0 is a **Laravel API + React SPA**. Vercel hosts the **static SPA and an API proxy**; the **Laravel app and database** run on a PHP host (Railway is the path documented here).

## Automatic deploy on every push (recommended)

Neither Cursor nor this repo can deploy to **your** Vercel/Railway accounts until **you** connect them once. After that, deploys are automatic—no need to ask the agent each time.

1. **Push the repo to GitHub** (or GitLab/Bitbucket supported by Vercel/Railway).
2. **Railway** → New project → Deploy from repo → add Postgres → set env vars (`APP_KEY`, `APP_URL`, `FRONTEND_URL`, etc.) → enable **Deploy on push** (default).
3. **Vercel** → Import the same repo → confirm `vercel.json` build → set **`BACKEND_URL`** to the Railway URL → enable **Production Branch** = `main` (default).
4. On each push to `main`: Railway redeploys the API; Vercel rebuilds the SPA. Update `FRONTEND_URL` on Railway if your Vercel domain changes.

**Optional — agent-assisted deploy from chat:** install CLIs and tokens in your environment (you run login once):

- Vercel: [create token](https://vercel.com/account/tokens) → `VERCEL_TOKEN` in shell or CI.
- Railway: `railway login` locally, or `RAILWAY_TOKEN` for CI.

Then you can say “deploy main” and the agent can run `vercel --prod` / `railway up` if those tools and tokens are available. Git-based auto-deploy is still simpler for day-to-day use.

## Architecture

```
Browser  →  your-app.vercel.app
              ├─ /*           → Vite SPA (dist/)
              └─ /api/*       → Vercel function → BACKEND_URL (Railway Laravel)
```

The SPA keeps `baseURL: /api/v1` (same origin). Vercel forwards `/api/...` to Railway.

---

## 1. Deploy the Laravel API (Railway)

1. Push this repo to GitHub.
2. Create a project at [railway.app](https://railway.app) → **Deploy from GitHub** → select the repo.
3. Add **PostgreSQL** (Railway plugin) or use SQLite for a throwaway demo (PostgreSQL recommended).
4. Set **Variables** on the Railway service:

| Variable | Example |
|----------|---------|
| `APP_KEY` | Run `php artisan key:generate --show` locally and paste |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://your-service.up.railway.app` |
| `FRONTEND_URL` | `https://your-project.vercel.app` (set after Vercel deploy) |
| `DB_CONNECTION` | `pgsql` (if using Railway Postgres) |
| `DATABASE_URL` | *(Railway injects this when you link Postgres)* |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `sync` |
| `WORKBENCH_ALLOW_REGISTRATION` | `false` *(optional, for public demo)* |

Railway uses `railway.toml` to run migrations, seed demo data, and start `php artisan serve`.

5. Copy the public Railway URL (e.g. `https://workbench0-production.up.railway.app`).
6. Verify: `GET https://YOUR-RAILWAY-URL/up` → should return healthy.

---

## 2. Deploy the frontend (Vercel)

1. Import the same GitHub repo at [vercel.com/new](https://vercel.com/new).
2. **Framework preset:** Other (or Vite — build is driven by `vercel.json`).
3. Confirm settings (should match `vercel.json`):
   - **Build command:** `npm run build:vercel`
   - **Output directory:** `dist`
4. **Environment variables** (Vercel project → Settings → Environment Variables):

| Name | Value |
|------|--------|
| `BACKEND_URL` | Your Railway URL, **no trailing slash** (e.g. `https://workbench0-production.up.railway.app`) |

5. Deploy. Open the Vercel URL and log in with seeded demo users (see root `README.md`).

6. Update Railway `FRONTEND_URL` to your Vercel URL and redeploy Railway if you use direct CORS (optional when using the proxy).

---

## 3. Local check before deploy

```bash
npm ci
npm run build:vercel
# dist/ should contain index.html and assets/
```

Optional: test the proxy locally with Vercel CLI:

```bash
npm i -g vercel
vercel env pull .env.vercel.local   # after linking project
vercel dev
```

---

## Alternative: API URL without proxy

Set on Vercel at **build** time:

- `VITE_API_URL=https://YOUR-RAILWAY-URL/api/v1`

Then the browser calls Railway directly. You **must** set `FRONTEND_URL` on Laravel to your Vercel origin (`config/cors.php`).

---

## Demo credentials

After seeding (Railway start command):

| Role | Email | Password |
|------|-------|----------|
| Learner | `learner@workbench0.local` | `password` |
| Admin | `admin@workbench0.local` | `password` |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 503 on login | `BACKEND_URL` missing or wrong on Vercel |
| CORS errors | Use the `/api` proxy (leave `VITE_API_URL` unset) or set `FRONTEND_URL` on Railway |
| Blank page | Hard refresh; confirm `npm run build:vercel` succeeded and `dist/index.html` exists |
| 500 on Railway | Check logs; run `APP_KEY`, database URL, and `php artisan migrate` |

---

## Note on “Vercel only”

Full Laravel (PHP, MySQL, queues, file uploads) is **not** a good fit for Vercel alone. This split is the supported demo path: **Vercel = UI + proxy**, **Railway = API + DB**.
