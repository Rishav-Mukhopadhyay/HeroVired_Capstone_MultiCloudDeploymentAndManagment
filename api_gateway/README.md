# MERN Ecommerce — API gateway

Minimal reverse proxy in front of the four microservices (`identity_server`, `catalog_server`, `commerce_server`, `notification_server`). This is what `client/` actually talks to — it listens on port 3000, exactly where the original `server/` monolith used to, so `client/.env`'s `API_URL=http://localhost:3000/api` and the Socket.IO connection both keep working unchanged.

Routes by path prefix — see `index.js`'s `routes` table — and separately proxies the Socket.IO websocket upgrade to `notification_server`.

## Setup

```
cd api_gateway
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `PORT` | Port this gateway listens on (defaults to `3000`) |
| `BASE_API_URL` | Path prefix, must match every service's own `BASE_API_URL` (e.g. `api`) |
| `IDENTITY_URL` | Base URL of `identity_server` |
| `CATALOG_URL` | Base URL of `catalog_server` |
| `COMMERCE_URL` | Base URL of `commerce_server` |
| `NOTIFICATION_URL` | Base URL of `notification_server` |

Deploying each service to a different cloud later is just a matter of pointing these four URLs at wherever they end up.

## Run

```
npm run dev
npm run start
```
