# ♔ Chess — Async Online Play

Asynchronous online chess built with Next.js and Vercel KV (Upstash Redis).

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "chess app"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOU/chess-async.git
git branch -M main
git push -u origin main
```

### 2. Deploy

1. Go to [vercel.com/new](https://vercel.com/new) → Import repo → Deploy
2. **Set Root Directory to `chess-app`** if your repo has a subfolder

### 3. Add Redis Storage

1. In Vercel project → **Storage** tab → **Upstash** → **Redis**
2. Free tier is fine. Connect it to your project.
3. Redeploy.

Done — your chess app is live.

## Local Dev

```bash
npm install
npx vercel env pull .env.local
npm run dev
```
