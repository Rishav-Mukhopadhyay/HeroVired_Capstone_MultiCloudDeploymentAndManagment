# MERN Ecommerce — Catalog microservice

Express + MongoDB microservice: product, category, brand, review, and wishlist. Split out of the original `server/` monolith. Deployed/run independently of `identity_server`, `commerce_server`, `notification_server`, and `api_gateway` — shares only the MongoDB database and `JWT_SECRET` with them.

## Setup

```
cd catalog_server
npm install
cp .env.example .env
```

Fill in `.env` the same way as `identity_server/README.md` describes (`PORT` defaults to `3102`).

## Run

```
npm run dev
npm run start
```

Routes: `/api/product/*`, `/api/category/*`, `/api/brand/*`, `/api/review/*`, `/api/wishlist/*`. Normally reached through `api_gateway`, not directly, in local dev.
