# DawnCast (Next.js)

Same weather + disaster-alert tool endpoint as before, rebuilt as a Next.js
API route instead of a standalone Express server.

## Local setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and add your real OpenWeatherMap API key
npm run dev
```

Test it:
```bash
curl http://localhost:3000/api/weather
```

## Why Next.js is actually better for this than Express + ngrok

Deploy this to **Vercel** (free, and it's made by the Next.js team so it's a
one-command deploy) and you get a **permanent public HTTPS URL** immediately —
no ngrok tunnel needed at all, even for your final hackathon submission.

### Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Follow the prompts (link/create a project). Once deployed, add your
`OPENWEATHERMAP_API_KEY` as an environment variable in the Vercel dashboard
(Project → Settings → Environment Variables), then redeploy:

```bash
vercel --prod
```

You'll get a URL like `https://dawncast.vercel.app`. Your tool endpoint is
then:
```
https://dawncast.vercel.app/api/weather
```

Use that as `WEATHER_TOOL_URL` when you run AssemblyAI's `create_dawncast.py`
setup script.

## Project structure

```
app/
  api/weather/route.js   ← the endpoint AssemblyAI's agent calls
  layout.js              ← minimal required root layout
  page.js                ← placeholder homepage (build out your UI here later)
lib/
  openweather.js         ← OpenWeatherMap fetcher
  gdacs.js               ← GDACS disaster-alert fetcher
```

## Notes

- `active_alert` is always explicit (true/false) from GDACS data — never
  inferred from rain probability, per AssemblyAI's own agent instructions.
- GDACS alerts are filtered to `orange`/`red` severity and to events listing
  Bangladesh as an affected country — GDACS doesn't break alerts down to
  city-level, so this is country-wide precision, not Sylhet-specific.
- If your OpenWeatherMap key is on the classic free tier (not One Call 3.0),
  tell me and I'll swap `lib/openweather.js` to use `/data/2.5/forecast`
  instead.