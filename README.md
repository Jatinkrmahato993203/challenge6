# SaansAI

SaansAI helps households compare practical schedule changes using a regional PM2.5 forecast and their own fixed and flexible commitments. It includes an indoor guide and a synthetic community event scenario.

## Run locally

Use Node.js 24 and npm. No external credentials are required for the sample day or community demo.

```sh
npm ci
npm run dev
```

Open the app on port 3000. Choose **Try a sample day**, then **Compare my day**. The synthetic demo moves the morning walk from 07:00 to 11:00, preserves school drop-off at 08:00, and yields 90 → 40 µg·h/m³. Open the evidence panel to see the forecast intervals used, then lock the walk and compare again. You can also accept the proposed schedule, restore the original, or delete the browser-stored routine.

`/api/health` returns a readiness response. `/api/forecast?cityId=delhi&mode=demo` checks access to the built-in forecast.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The browser suite tests the production build and uses installed Chromium when available. Otherwise, install the test browser with `npx playwright install chromium`. The suite disables live forecasts and Gemini, starts its own server on port 3101, and exercises the sample, the outage state, the community demo, and keyboard and accessibility checks. To use a different Chromium binary, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Forecast and Gemini configuration

- Live forecasts need HTTPS access to `air-quality-api.open-meteo.com`. In a cloud machine with an inherited HTTP proxy, set `NODE_USE_ENV_PROXY=1` for the Next.js process so Node uses that route. The app shows an explicit error if a request fails and offers the synthetic demo as a separate action.
- The demo is available by default. Set `DEMO_DATA_MODE=false` to disable it or `LIVE_FORECAST_ENABLED=false` for a demo-only environment.
- For optional AI explanations, set `AI_EXPLAIN_ENABLED=true`, `GEMINI_MODEL` to an enabled model, `GEMINI_API_KEY`, and `SAANSAI_SIGNING_SECRET` to a randomly generated value of at least 32 characters. The server needs access to `generativelanguage.googleapis.com`. Use the same signing secret across instances. Store secrets in deployment settings or a gitignored `.env.local`. The deterministic explanation works with no credentials.
- `RATE_LIMIT_PER_MINUTE` defaults to 30 with a separate lower cap for AI requests. The limiter is per running process. Use deployment-side limits and cost controls for a public release.
- Deploy with Vercel’s Next.js preset and Node.js 24. Verify the live and demo paths with the deployment’s settings. Review provider terms, attribution, and the privacy notice before publishing publicly. Open-Meteo’s free API is intended for eligible non-commercial use.

## API contract

Requests use JSON and same-origin access. Forecasts are fetched by the server or selected from built-in fixtures. Plan IDs and explanation context do not require a database.

| Route | Input | Output |
| --- | --- | --- |
| `GET /api/health` | None | Status, app version, demo capability |
| `GET /api/forecast` | `cityId=delhi\|mumbai\|bengaluru`, `mode=live\|demo` | City, timezone, source metadata and hourly PM2.5 values in µg/m³ |
| `POST /api/plans/optimize` | `{ plan, mode }` | Original plan, result status, up to three alternatives, evidence and optional explanation token |
| `POST /api/explain` | `{ token }` | Approved headlining text, explanation, guidance IDs and `model` or `fallback` |
| `POST /api/community/simulate` | `{ minimumAttendees }`, integer 1–20 | Eligible sample slots, synthetic aggregate counts, and supported comparison |

A plan contains `cityId`, `dateLocal`, `timezone: "Asia/Kolkata"`, `preference` and one to eight `activities`. Each activity contains a unique `id`, `label`, `environment`, `startAt`, `durationMinutes`, `fixed`, and `candidateStarts`. Optional fields are `travelBufferMinutes`, `mode`, and `distanceKm`. Use ISO 8601 timestamps with offsets or UTC. Fixed activities allow only their original start. The original start also belongs in a flexible activity’s permitted set. Field constraints are defined in `src/lib/contracts.ts`.

`ALTERNATIVES_FOUND`, `NO_BETTER_OPTION`, and `INSUFFICIENT_DATA` are successful comparison responses. Invalid schedules and complexity limits return 422. Live forecast unavailability returns 503. Standard request errors contain `{ error: { code, message, requestId } }`.

Regional models have coarse spatial resolution. A lower modeled outdoor concentration-time indicator does not establish inhaled dose, indoor air quality, or health risk. The app ships no emissions factors, so it does not display an emissions estimate.
