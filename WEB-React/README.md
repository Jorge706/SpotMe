# SpotMe — Web Client

Live-tracking web dashboard for the SpotMe platform: watch vehicle positions update in real time, manage devices, and review trips from the browser.

## Features

- **Real-time positions** — subscribes to trip and location events over **Pusher (WebSockets)**; no polling.
- **Trip & device views** — browse active and historical trips reported by the Tracking API.
- **Authenticated access** — JWT-based sessions against the Users API, with reCAPTCHA on sign-in.

## Stack

React 19 · Vite · React Router 7 · pusher-js

## Running locally

```bash
npm install
npm run dev       # development server (vite.config.dev.js)
npm run build     # production build (vite.config.prod.js)
npm run lint      # eslint
```

Part of the [SpotMe monorepo](https://github.com/Jorge706/SpotMe) — see the root README for the full architec