# MERN Ecommerce — Server

Express + MongoDB REST API for the MERN Ecommerce store. This app is deployed independently from `client/` — it exposes a JSON API and has no knowledge of how or where the frontend is hosted.

## Requirements

- Node.js
- A MongoDB instance (local or hosted) that this server can reach

## Setup

```
cd server
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on (defaults to `3000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `BASE_API_URL` | Path prefix all routes are mounted under (e.g. `api` → `/api/...`) |
| `MAIL_FROM` | Optional. Display "from" address for outbound emails (see `services/mail.js`) — defaults to `no-reply@mern-ecommerce.local` |

## Run

```
npm run dev     # nodemon, auto-restart on change
npm run start   # production start: NODE_ENV=production node index.js
```

## Seeding data

Database seeding (an admin user plus sample catalog data) is a separate project, `seed_db/` — it is not part of this server and never runs as a side effect of starting it. See [seed_db/README.md](../seed_db/README.md).

## Tests

```
npm test   # jest --coverage
```

Uses an in-memory MongoDB instance (`mongodb-memory-server`) — no real database connection or `.env` needed to run the suite. Coverage is enforced at 100% lines (see `jest.config.js`). See `CLAUDE.md`'s "Testing" section for how the test infrastructure is put together if you're adding to it.

## Deploying

This is a plain long-running Node/Express process — there is no bundled Dockerfile, Vercel config, or process manager. To deploy:

1. Provision a host that can run a persistent Node process (a VM, container platform, or PaaS of your choice) and a reachable MongoDB instance.
2. Set the environment variables above on that host.
3. Run `npm install --production` followed by `npm run start`.
4. Put a process manager in front of it (pm2, systemd, or your platform's equivalent) so it restarts on crash/reboot — none is configured here.
5. Note the public URL/port this ends up on — the client's `API_URL` needs to point at it (see `client/README.md`).

CORS is currently wide open (`cors()` with no origin restriction in `index.js`), since client and server run on different origins by design. Consider restricting it to the client's deployed origin before exposing this publicly.
