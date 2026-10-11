# MERN Ecommerce — API gateway

Minimal reverse proxy in front of the four microservices (`identity_server`, `catalog_server`, `commerce_server`, `notification_server`). This is what `client/` actually talks to — it listens on port 3000, exactly where the original `server/` monolith used to, so `client/.env`'s `API_URL=http://localhost:3000/api` and the Socket.IO connection both keep working unchanged.

Routes by path prefix — see `index.js`'s `routes` table — and separately proxies the Socket.IO websocket upgrade to `notification_server`. `commerce_server` is the one exception to "one prefix per resource": it's a single GraphQL endpoint, so its whole entry is just `{ path: [\`${api}/graphql\`], target: COMMERCE_URL }` rather than one prefix per resource the way `identity_server`/`catalog_server`/`notification_server` still are.

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

## Testing

```
npm test           # jest --coverage
npm run test:watch
```

`jest.config.js` fails the run below **100% statements/branches/functions/lines** coverage — the same bar every other service in this project holds. An HTML report is written to `coverage/index.html`. `index.js` has no database and no `routes`/`models` of its own, so tests spin up plain fake HTTP (+ one real Socket.IO) backend services and point this gateway at them instead — see `index.test.js` and `index.defaults.test.js`.

Node's coverage tooling has no JaCoCo-style complexity counter; `npm run analyze:complexity` reports per-function cyclomatic complexity informationally (via a one-off `eslint` rule, not a committed ESLint config) instead of gating on it.
