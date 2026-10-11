# MERN Ecommerce — Commerce microservice (Python / Flask / GraphQL)

Flask + PyMongo microservice: cart, order, and merchant application management. Originally a Python rewrite of the Node/Express `commerce_server` with the same REST contract, this service has since been converted a second time to **GraphQL** — a single `POST /api/graphql` endpoint (Graphene) replaces the old per-resource REST routes. It's the only GraphQL service in this project; every other backend service is still REST. `api_gateway`'s routing table and `client/`'s Cart/Order/Merchant `actions.js` both changed to match (see "GraphQL migration notes" below) — everything downstream of those two still works exactly the same from a user's perspective. Deployed/run independently of `identity_server`, `catalog_server`, `notification_server`, and `api_gateway` — shares the MongoDB database and `JWT_SECRET` with them, and makes one outbound HTTP call to `notification_server` (`NOTIFICATION_URL`) to send order-confirmation emails.

## Requirements

- Python 3.12

## Setup

```
cd commerce_server
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements-dev.txt   # runtime + test deps
cp .env.example .env
```

Fill in `.env` the same way as the other services' `.env.example`s:

| Variable | Description |
| --- | --- |
| `PORT` | Port this service listens on (defaults to `3103`) |
| `MONGO_URI` | MongoDB connection string — same database every other microservice points at |
| `JWT_SECRET` | Must be **identical** across every microservice |
| `BASE_API_URL` | Path prefix routes are mounted under (e.g. `api` → `/api/...`) |
| `NOTIFICATION_URL` | Base URL of `notification_server` — used for the fire-and-forget order-confirmation email call |

`.env` is loaded via `python-dotenv` in `run.py`, matching the other services' `dotenv`-based setup.

## Run

```
python run.py
```

Single endpoint: `POST /api/graphql`. Normally reached through `api_gateway`, not directly, in local dev. There's no GraphiQL/playground UI wired in — send `{"query": "...", "variables": {...}}` directly (see `app/graphql/schema.py` for the full Query/Mutation field list, or `client/app/containers/{Cart,Order,Merchant}/actions.js` for real example queries).

## Testing

```
pytest
```

`pytest.ini` runs the suite with `pytest-cov` under `--cov-branch` and **fails below 100% line+branch coverage** (`--cov-fail-under=100`), the same bar every other service in this project holds. An HTML report is written to `htmlcov/index.html`.

**On "complexity coverage"**: Python's coverage tooling (`coverage.py`/`pytest-cov`) has no direct equivalent of JaCoCo's COMPLEXITY counter (a ratio of exercised-vs-total McCabe complexity paths). The closest real equivalent is **branch coverage** — every `if`/`elif`/boolean-decision path taken both ways at least once — which this suite already enforces at 100%; that inherently exercises every cyclomatic-complexity path a function has, since complexity and branch count are the same underlying thing counted differently. `radon` (a dev dependency) is included to *report* per-function cyclomatic complexity as an informational metric (`radon cc app -a`), not as a coverage gate, since it measures the code's structure, not what the tests exercised.

Tests are unit tests (`unittest.mock`) for every resolver/module — `app.db.get_db()` is monkeypatched to a mock, no real MongoDB needed — covering every success path, error path, and validation branch, driven exclusively through real HTTP requests to `/api/graphql` (`tests/conftest.py`'s `graphql_request()` helper) rather than by calling resolver functions directly, so `app/graphql/view.py`'s status/body mapping is covered too. Plus an app-factory smoke test (`tests/test_app_factory.py`) that verifies the endpoint is actually mounted, and unit tests for `app/auth.py`'s JWT verification (`tests/test_auth.py`).

## GraphQL migration notes

This service used to expose `/api/cart/*`, `/api/order/*`, `/api/merchant/*` — one REST route per operation, same as every other backend service. That's gone; `app/blueprints/` no longer exists. In its place:

- **`app/graphql/`** — `schema.py` (the assembled `Query`/`Mutation` types), `types.py` (GraphQL object/input types), `errors.py` (a typed exception hierarchy resolvers raise), `context.py` (per-request context carrying the already-verified caller), `view.py` (the actual Flask route), and `resolvers/{cart,order,merchant}.py` (the business logic, one file per old blueprint, same function-per-old-route structure).
- **Errors are deliberately not standard GraphQL-over-HTTP.** The spec's usual behavior is "always reply 200, put failures in a top-level `errors` array" — this service instead replies with the *old REST-shaped* status/body (401/403/400/404 + `{"error": ...}` or `{"message": ...}`) for every typed failure, so `client/app/utils/error.js` (which branches on HTTP status the REST way, shared by every other service) needed **zero changes**. See `app/graphql/errors.py`'s module docstring for the full mechanism.
- **Field naming**: every type's identifier is `_id` (via `graphene.ID(name="_id")`), not GraphQL's usual `id` — matches what `client/`'s Redux reducers/components already read off an order/merchant object, so none of them needed touching.
- **Nested data**: an order's line items (`products`) and a merchant's populated brand (`brand`) come back as a single opaque JSON value (`GenericScalar`) rather than individually-selectable GraphQL fields — the client just selects `products`/`brand` once and gets the same nested shape the old REST JSON body carried, so no client-side nested-field access needed to change either.
- **`api_gateway/index.js`**: one routing-table entry (`{ path: [\`${api}/graphql\`], target: COMMERCE_URL }`) replaced the old three (`cart`/`order`/`merchant`).
- **`client/`**: `app/utils/graphql.js` is a new shared `graphqlRequest(query, variables)` helper; `Cart`/`Order`/`Merchant`'s `actions.js` use it instead of per-endpoint `axios` calls, but every action's dispatched payload shape, error handling, and the rest of each duck (reducers, components) are unchanged.

## Compatibility notes

- **JWT**: HS256, verified with the raw UTF-8 bytes of `JWT_SECRET` (same as Node's `jsonwebtoken` and `identity_server`'s JJWT) — tokens issued by `identity_server` are verified correctly here.
- **Passwords**: `bcrypt.hashpw(..., bcrypt.gensalt(rounds=10))` — same algorithm/cost factor as the Node services' `bcryptjs` (the `merchantSignup` mutation hashes a new merchant's password the same way `identity_server`/`seed_db` do).
- **Document shape**: PyMongo already uses `_id` as the document key natively (unlike the Java port, no field-renaming trick was needed) — `app/json_utils.py` only converts `ObjectId`/`datetime` values to JSON-safe strings before they reach a GraphQL response, matching Mongoose's own default `.toJSON()` output shape.
- **One disclosed behavior difference**: the order-confirmation email call to `notification_server` runs synchronously here (wrapped in try/except so it can never fail checkout), rather than truly fire-and-forget the way Node's un-awaited promise is. The guarantee that matters — a slow/down `notification_server` never fails or blocks the *order itself* from being recorded — is preserved exactly; only the response-latency profile differs slightly, which doesn't affect correctness for this project's purposes.
- Every other quirk of the original routes is preserved as-is for parity, including that `addMerchant` and `merchantSignup` have no auth requirement (public merchant application/signup), and every JS falsy/truthy edge case in `app/store.py`'s tax math (documented inline where Python's semantics differ from JS's, e.g. `[]` is falsy in Python but truthy in JS).
