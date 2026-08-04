# MERN Ecommerce — Identity microservice

Express + MongoDB microservice: authentication (login/register/password reset) and user/address management. Split out of the original `server/` monolith. Deployed/run independently of `catalog_server`, `commerce_server`, `notification_server`, and `api_gateway` — shares only the MongoDB database and `JWT_SECRET` with them.

## Setup

```
cd identity_server
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `PORT` | Port this service listens on (defaults to `3101`) |
| `MONGO_URI` | MongoDB connection string — same database every other microservice points at |
| `JWT_SECRET` | Must be **identical** across every microservice — each verifies the same stateless JWT independently, with no central auth server |
| `BASE_API_URL` | Path prefix routes are mounted under (e.g. `api` → `/api/...`) |

## Run

```
npm run dev     # nodemon, auto-restart
npm run start   # production start
```

Routes: `/api/auth/*`, `/api/user/*`, `/api/address/*`. Normally reached through `api_gateway`, not directly, in local dev.
