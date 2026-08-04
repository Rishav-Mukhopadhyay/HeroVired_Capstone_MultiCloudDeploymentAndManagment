# MERN Ecommerce — Commerce microservice

Express + MongoDB microservice: cart, order, and merchant application management. Split out of the original `server/` monolith. Deployed/run independently of `identity_server`, `catalog_server`, `notification_server`, and `api_gateway` — shares the MongoDB database and `JWT_SECRET` with them, and makes one outbound HTTP call to `notification_server` (`NOTIFICATION_URL`) to send order-confirmation emails.

## Setup

```
cd commerce_server
npm install
cp .env.example .env
```

Fill in `.env` the same way as `identity_server/README.md` describes (`PORT` defaults to `3103`), plus:

| Variable | Description |
| --- | --- |
| `NOTIFICATION_URL` | Base URL of `notification_server` — used for the fire-and-forget order-confirmation email call in `routes/api/order.js` |

## Run

```
npm run dev
npm run start
```

Routes: `/api/cart/*`, `/api/order/*`, `/api/merchant/*`. Normally reached through `api_gateway`, not directly, in local dev.
