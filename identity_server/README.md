# MERN Ecommerce — Identity microservice (Java / Spring Boot)

Spring Boot 3 + Maven + MongoDB microservice: authentication (login/register/password reset) and user/address management. This is a Java rewrite of the original Node/Express `identity_server` — same REST contract (routes, request/response JSON shapes, status codes), so `client/` and `api_gateway` needed **no changes**. Deployed/run independently of `catalog_server`, `commerce_server`, `notification_server`, and `api_gateway` — shares only the MongoDB database and `JWT_SECRET` with them (issues the JWTs the other three verify).

## Requirements

- JDK 21
- No separate Maven install needed — this project includes the Maven Wrapper (`mvnw`/`mvnw.cmd`), which downloads the right Maven version on first run.

## Setup

```
cd identity_server
cp .env.example .env
```

Fill in `.env` the same way as the Node services' `.env.example`s:

| Variable | Description |
| --- | --- |
| `PORT` | Port this service listens on (defaults to `3101`) |
| `MONGO_URI` | MongoDB connection string — same database every other microservice points at |
| `JWT_SECRET` | Must be **identical** across every microservice — see the root README |
| `BASE_API_URL` | Path prefix routes are mounted under (e.g. `api` → `/api/...`) |

`.env` is loaded via `spring-dotenv`, matching the other services' `dotenv`-based setup.

## Run

```
./mvnw.cmd spring-boot:run     # Windows dev, auto-reads .env
./mvnw.cmd clean package       # builds target/identity-server-0.0.1-SNAPSHOT.jar
java -jar target/identity-server-0.0.1-SNAPSHOT.jar   # production-style start
```

Routes: `/api/auth/*`, `/api/user/*`, `/api/address/*` — identical paths/shapes to the original Node service. Normally reached through `api_gateway`, not directly, in local dev.

## Testing

```
.\mvnw.cmd test       # run the suite
.\mvnw.cmd verify      # run the suite + enforce the coverage gate (fails the build below threshold)
```

JaCoCo enforces **100% instruction/line/branch/complexity/method/class coverage** (see `pom.xml`'s `jacoco-maven-plugin` config), the same bar the Node projects hold via Jest/Vitest. `IdentityServerApplication` (the `main` method bootstrap) is excluded from the enforced threshold — it's still instrumented and shown in the HTML report at `target/site/jacoco/index.html`, just not required to hit 100%, since a `@SpringBootTest` context-load test doesn't actually invoke `main()` the way running the app does.

Tests are unit tests (JUnit 5 + Mockito) for controllers/services/filters — repositories and `MongoTemplate` are mocked, no real MongoDB needed — plus one Spring-context integration test (`SecurityConfigTest`, via `MockMvc`) that verifies the actual permitAll-vs-authenticated routing rules end to end, since that can't be exercised by unit-testing the controllers directly.

## Compatibility notes

- **Passwords**: uses Spring Security's `BCryptPasswordEncoder` at the same default strength (10) as the Node services' `bcryptjs` — existing password hashes in the shared database verify correctly without re-seeding.
- **JWT**: HS256, signed with the raw UTF-8 bytes of `JWT_SECRET` (same as Node's `jsonwebtoken`), single `id` claim — tokens this service issues are verified correctly by `catalog_server`/`commerce_server`/`notification_server`, and vice versa.
- **Two intentional behavior changes** from the original Node route (both flagged in `UserController`'s class comment too): `PUT /api/user` now only applies `firstName`/`lastName`/`phoneNumber`/`avatar` from the request body (the original applied the entire body with no field whitelist, which let a caller set their own `role`/`merchant` — a privilege-escalation bug), and that same endpoint's response no longer includes the password hash (the original echoed the full updated document back, including it).
- Every other quirk of the original routes — including that `GET`/`PUT /api/address/{id}` and `DELETE /api/address/delete/{id}` have no auth requirement, and that `GET /api/user/search`/`GET /api/user` project out `_id` as well as `password` — is preserved as-is for parity.

## About the JDK/Maven setup on this machine

Java 21 was installed via `winget install Microsoft.OpenJDK.21`. No standalone Maven install was needed — the Maven Wrapper handles that automatically the first time `mvnw`/`mvnw.cmd` runs.
