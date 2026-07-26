# MERN Ecommerce — seed_db

Standalone script that seeds the store's database with an admin user plus sample catalog data (categories, brands, products). This is a separate project from `client/` and `server/` — it has its own `package.json`/`node_modules`/`.env`, keeps its own copies of the Mongoose schemas it needs (see `models/`), and is run on demand. It is never invoked automatically by `client` or `server` starting up.

## Requirements

- Node.js
- A MongoDB instance (local or hosted) that this script can reach — typically the same one `server/` points at

## Setup

```
cd seed_db
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB connection string — point this at the same database `server/.env`'s `MONGO_URI` uses if you want the seeded data to show up in the app |

## Run

```
npm start <email> <password>
```

Example:

```
npm start admin@gmail.com Password@123
```

This creates:

- One admin user (`role: ROLE ADMIN`) with the given email/password (bcrypt-hashed)
- 10 categories, 10 brands, and 100 products (via `@faker-js/faker`), each product with a real, reachable `imageUrl` (LoremFlickr)

**Idempotent per-collection**: each of admin/categories/brands/products is only seeded if that collection doesn't already have enough documents, so re-running it against an already-seeded database is a no-op (it logs "already exists/sufficient, skipping" for each) rather than duplicating data. Both `email` and `password` are required — running without them logs an error and exits without touching the database.

## Tests

```
npm test   # jest --coverage
```

Uses an in-memory MongoDB instance (`mongodb-memory-server`) — no real database connection or `.env` needed to run the suite. Coverage is enforced at 100% lines (see `jest.config.js`).
