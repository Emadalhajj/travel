# Production deployment

This document is the deployment contract for the API, recovery worker, MongoDB,
private documents, and the pre-built frontend.

## Runtime and installation

- Use Node.js 22 LTS and the npm version bundled with it.
- Run `npm ci` in the repository root, `backend`, and `frontend`.
- Build the frontend with `CI=true npm run build` from `frontend`.
- Deploy only the generated `frontend/build` directory to the static web host.
  Never expose CRA's development server in production.

## Release order

1. Back up MongoDB and the private uploads volume.
2. Install from lockfiles with `npm ci`.
3. Build and publish `frontend/build`.
4. From `backend`, run the release migration when applicable:
   `npm run migrate:drop-obsolete-booking-indexes`.
5. Start or roll the API process with `npm start`.
6. Start exactly one recovery worker with `npm run start:recovery`.
7. Wait for `/ready` to return HTTP 200 before sending traffic.

The obsolete-index migration is independent from startup and safe to run more
than once. Do not run ad-hoc schema or index deletion during API startup.

## Processes and scaling

The web and recovery processes have separate responsibilities:

```text
Web process x N       -> HTTP API only
Recovery worker x 1  -> payment, hold, and draft recovery
```

The API process never starts a recovery timer. The worker prevents overlap in
one process, but it does not provide a distributed lease. Do not deploy a
second worker replica until a Mongo-backed distributed lease is implemented.

`DB_MIN_POOL_SIZE` and `DB_MAX_POOL_SIZE` apply per process. Size the MongoDB
deployment for `(web replicas + worker) * DB_MAX_POOL_SIZE`, with capacity left
for migrations and operational access.

Use a process supervisor or container restart policy equivalent to
`on-failure`, with bounded backoff. The platform should send `SIGTERM` and allow
at least `SHUTDOWN_TIMEOUT_MS` before forcefully killing the API. The worker
waits for an active recovery run before disconnecting MongoDB.

## Environment

Copy names from `.env.example`; never deploy that file as credentials. At a
minimum production requires:

- `NODE_ENV=production`
- `DB_URL`, `DB_NAME`
- a long random `JWT_SECRET` and explicit `JWT_EXPIRES_IN`
- `FRONTEND_URL` containing the exact allowed HTTPS origin(s)
- provider credentials for every enabled OAuth, payment, or email provider

Google variables are an all-or-nothing group. Stripe and HyperPay secrets are
server-only and must never use a `REACT_APP_` prefix. Rotate secrets through the
deployment secret manager rather than editing source files.

`PAYMENT_RECOVERY_INTERVAL_MS` is clamped to 60000–300000 ms and defaults to
120000 ms. `PAYMENT_RECOVERY_BATCH_LIMIT` controls the bounded recovery batch.

## Reverse proxy, HTTPS, and CORS

- Terminate HTTPS at the load balancer/reverse proxy and redirect HTTP to HTTPS.
- Set `TRUST_PROXY` to the actual number/range of trusted proxy hops. Do not set
  it broadly unless the platform network prevents direct client access.
- Forward `Host`, `X-Forwarded-Proto`, and the client IP headers.
- `FRONTEND_URL` must list only approved frontend origins. Production startup
  fails when it is missing; wildcard credentialed CORS is not supported.
- Preserve request body and upload limits at the proxy. Do not raise them above
  the application limits without a reviewed use case.

## Health and readiness

- `GET /health` is a liveness check and returns minimal process state.
- `GET /ready` returns 200 only while Mongoose is connected and returns 503
  when MongoDB is unavailable.

Use `/health` for liveness and `/ready` for readiness. Remove an instance from
traffic immediately on readiness failure. Neither endpoint should be protected
or expose credentials, connection strings, topology, or database names.

## Persistent uploads

`backend/private-uploads` contains passports, IDs, national-address documents,
and payment proofs. It must be mounted on persistent encrypted storage and must
not be served by a public static-file route.

For containers, mount a durable volume at the absolute path corresponding to
`backend/private-uploads`, or replace the filesystem adapter with private object
storage before launch. A container's writable layer or other ephemeral disk is
not acceptable. Public catalog images also require persistence if stored under
the local `backend/public/uploads` tree.

Restrict storage access to the API identity and backup operator. Downloads must
continue through the authenticated private-file endpoint. Do not expose the
private volume through Nginx, a CDN, or an object-storage public bucket.

## Backup, restore, and rollback

Before the first live booking and before every schema/index migration:

- create an encrypted MongoDB backup with point-in-time recovery where the
  provider supports it;
- back up the private uploads volume/object bucket and retain version history;
- verify that database and file backups share a recoverable time window;
- record the deployed Git commit and retain the previous frontend and backend
  artifacts for application rollback.

Test restoration into an isolated environment before launch and periodically
after launch. A backup is not considered confirmed until a restore test has
succeeded. Application rollback must not blindly reverse a migration: restore
the previous artifact first, and restore data only under an approved incident
procedure when the newer schema is incompatible.

## Required release checks

Before shifting production traffic, record evidence for:

```text
npm ci (root/backend/frontend)
frontend tests and CI production build
backend tests and syntax check
git diff --check and secret scan
/health = 200 and /ready = 200 with Mongo connected
/ready = 503 with Mongo disconnected
one recovery-worker cycle
idempotent release migration
authorization and booking/payment regression tests
persistent volume/object-storage mount
Mongo and private-upload backup plus restore test
```

The repository can verify the software checks. The deployment owner must sign
off the storage mount, backup/restore evidence, DNS/TLS, proxy configuration,
and the single-worker replica count for each environment.
