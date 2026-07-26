# MERN Ecommerce — Client

React + Redux storefront/dashboard for the MERN Ecommerce store. This app is deployed independently from `server/` — it builds down to a static bundle that talks to the API over HTTP via `API_URL`.

## Requirements

- Node.js

## Setup

```
cd client
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `API_URL` | Full base URL of the deployed server's API (e.g. `https://api.example.com/api`) |

## Run locally

```
npm run dev
```

Starts webpack-dev-server on `http://localhost:8080`.

## Build

```
npm run build
```

Produces a static production bundle in `client/dist` (cleaned and rebuilt each time).

## Deploying

`client/dist` is a static single-page app — serve it with any static file host (there is no bundled Dockerfile or nginx/Vercel config).

This app uses browser (non-hash) routing, so whatever serves `dist/` **must fall back to `index.html` for unknown paths**, or refreshing on a route like `/shop` will 404. Most static hosts call this an "SPA fallback" / "rewrite all routes to index.html" option — enable it, or configure your web server's equivalent of `try_files $uri /index.html`.

Set `API_URL` (baked in at build time via `.env`) to wherever `server/` ends up deployed before running `npm run build` — see `server/README.md`.
