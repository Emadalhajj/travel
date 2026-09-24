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
4. Run `npm run preflight:indexes`, `npm run preflight:data`, and every applicable
   migration dry-run. Resolve every reported conflict before continuing.
5. Set `DATA_OPERATION_CONFIRM` to the exact `DB_NAME`, then run only the
   reviewed `:execute` commands during the release window.
6. Re-run index/data preflight and migration verification.
7. Start or roll the API process with `npm start`.
8. Start exactly one recovery worker with `npm run start:recovery`.
9. Wait for `/ready` to return HTTP 200 before sending traffic.

All migrations and seeds are independent from startup. Their default npm
commands are read-only dry-runs. Write commands require both an explicit
`:execute` command and `DATA_OPERATION_CONFIRM=<exact DB_NAME>`. Do not run
ad-hoc schema/index changes during API startup.

## Initialization data classification

- `REQUIRED_INITIAL_DATA`: Payment methods. Run `npm run seed:payment-methods`
  first to compare; then use `npm run seed:payment-methods:execute`. Existing
  records are never overwritten, and drift must be reviewed manually.
- `OPTIONAL_DEMO_DATA`: none.
- `DEVELOPMENT_ONLY`: none.
- `UNSAFE_FOR_PRODUCTION`: none exposed as an npm command. Never seed users,
  bookings, drafts, payments, coupons, inventory, or holds in production.

Legacy trip, payment-transaction, hotel-attachment, and bank-transfer repair
scripts are conditional migrations, not baseline seeds. Run them only when
their dry-run reports eligible legacy records.

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

When Duffel is enabled, configure `DUFFEL_ACCESS_TOKEN`,
`DUFFEL_WEBHOOK_SECRET`, and `DUFFEL_ORDER_HTTP_TIMEOUT_MS` (at least 130000
ms). Register the HTTPS receiver as
`POST /api/webhooks/flight-providers/duffel` for `order.created` and
`order.creation_failed`. Use separate Duffel test/live webhook secrets and do
not reuse the access token as the webhook secret. The recovery worker
reconciles pending orders; never retry Create Order manually after a timeout or
HTTP 202 response.

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

The repository-level rehearsal command is `npm run rehearse:restore`. It
accepts loopback MongoDB only, creates random temporary source/restore
databases, exercises `mongodump` and `mongorestore` twice, verifies documents
and indexes, and removes both databases. Provider backup/PITR restoration must
still be rehearsed in an isolated staging project using the provider's native
procedure before release.

Rollback decision:

1. Stop deployment and application writes.
2. If the migration is additive and old code remains compatible, restore the
   previous application artifact and run verification/smoke checks.
3. If data or indexes changed incompatibly, do not run an improvised reverse
   migration. Restore the verified pre-migration database and matching uploads
   backup into the approved target, then run index/data verification and smoke
   checks before reopening traffic.

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

## Observability contract

Application logs are newline-delimited JSON on stdout/stderr with `INFO`,
`WARN`, or `ERROR` severity. The hosting platform must collect both streams,
retain them according to the deployment policy, and index at least `event`,
`requestId`, `statusCode`, `paymentTransactionId`, `bookingId`, and
`inventoryHoldId` when present. The API returns `X-Request-Id`; preserve that
header at the reverse proxy and ask support callers for it.

Logs deliberately omit headers, cookies, request/response bodies, credentials,
provider payloads, document contents, and personal-document data. AuditLog and
BookingLog are the durable business audit sources; stdout logs are operational
signals and must not replace them. Never enable raw request logging to diagnose
payments or private uploads.

The release-one deployment invariant is:

```text
RECOVERY_WORKER_REPLICAS=1
```

API replicas may scale independently. Payment booking conversion and hold
release also use atomic database transitions to protect retries, but the worker
timer itself has only an in-process overlap guard. Do not run two worker
replicas until a distributed lease has been implemented and tested.

## Alert matrix

Thresholds and delivery destinations are `CONFIG_REQUIRED` and must be agreed
with the hosting/monitoring provider before traffic is enabled.

| Condition | Severity |
| --- | --- |
| API `/ready` failure or database unavailable | Critical |
| Aging `paid_pending_booking` or successful payment without Booking | Critical |
| Inventory preflight invariant violation | Critical |
| Repeated webhook authentication failures | High |
| Repeated recovery-worker failure or missing worker heartbeat | High |
| Bank transfer pending beyond the operational SLA | High |
| Repeated external notification failure | Medium |
| Single transient provider timeout/error | Warning |

At minimum, monitor recovery completion events and alert when no successful
cycle is observed for more than the configured interval plus the provider SLA.
Run `preflight:data` read-only on an approved schedule or incident trigger; any
non-zero inventory or orphan counter is an incident, not an automatic repair.

## Incident runbooks

Use an approved read-only account for diagnosis. Record the incident, deployed
commit, request/payment/booking identifiers, timestamps, and every action.

### API not ready or database unavailable

- Detect: `/health` remains 200 while `/ready` returns 503, or the readiness
  alert fires. Inspect structured startup/error events and managed Mongo health.
- Safe action: remove the instance from traffic, restore database connectivity,
  and restart through the platform supervisor if required.
- Do not: expose the Mongo URI, retry migrations, or point Production at another
  environment. Verify `/ready`, a read-only authenticated request, and worker
  connectivity before restoring traffic.

### Payment provider outage or webhook failure

- Detect: provider timeout/error events, repeated signature failures, or aging
  initiated/pending transactions. Inspect PaymentTransaction events and the
  provider dashboard using the provider reference.
- Safe action: preserve the transaction and Hold, correct provider/TLS/webhook
  configuration, then allow verified provider callbacks or the recovery worker
  to reconcile it.
- Do not: replay an unverified payload, mark a payment successful manually, or
  ask the customer to pay again when financial capture is possible. Verify one
  terminal transaction event and at most one linked Booking.

### `paid_pending_booking` or successful payment without Booking

- Detect: operations/payment filters, worker summary failures, or the critical
  aging alert. Inspect transaction events, conversion-lock timestamps, Draft,
  Hold, provider reference, and any linked Booking.
- Safe action: keep the single worker running; after fixing the recorded cause,
  let its idempotent recovery retry. Escalate for a reviewed one-off operation
  only if automated recovery repeatedly fails.
- Do not: create a Booking directly, consume a coupon manually, release a paid
  Hold, or initiate another charge. Verify transaction `SUCCESS`, one Booking,
  committed inventory, and matching AuditLog/BookingLog entries.

### Bank transfer stuck or rejected

- Detect: admin payment filters for pending approval/review beyond the business
  SLA or rejected status. Inspect proof authorization, amount/currency,
  reviewer audit, and Hold expiry.
- Safe action: an authorized reviewer approves or rejects through the existing
  admin action. Re-upload uses the customer flow where permitted.
- Do not: edit status in Mongo or expose the private proof URL. Verify the
  transaction timeline, audit entry, notification result, and Booking outcome.

### InventoryHold stuck or inventory mismatch

- Detect: worker hold-failure counts or a non-zero `preflight:data` report
  (`activeExpiredHolds`, counter mismatch, negative counters, or orphans).
- Safe action: stop affected sales if oversell is possible, capture the Hold and
  transaction state, and let recovery retry `RELEASE_FAILED` records. Escalate
  mismatches for a reviewed repair based on booking/payment evidence.
- Do not: decrement counters or delete Holds by hand. Verify preflight returns
  zero and affected availability agrees with committed bookings.

### Recovery worker failure

- Detect: repeated `payment_recovery_failed`, shutdown timeout, or missing
  completion events. Inspect the last summary counts and Mongo/provider health.
- Safe action: ensure exactly one replica, fix configuration/connectivity, and
  restart it with `npm run start:recovery`.
- Do not: start a second replica as a workaround. Verify one complete cycle and
  decreasing pending/failed operational records.

### Email or WhatsApp failure

- Detect: Notification records with `FAILED` and medium-severity alert counts.
  Inspect sanitized failure reason and channel configuration.
- Safe action: correct provider configuration and use the existing authorized
  retry operation. Booking/payment state remains authoritative.
- Do not: roll back a booking/payment or log provider credentials. Verify the
  same deduplication key is not delivered twice and status becomes `SENT`.

### Private document issue

- Detect: authorized download failure, storage alert, or unexpected 404. Inspect
  metadata and persistent-volume mount/permissions without copying contents.
- Safe action: restore the mount or an approved matching backup, then test via
  the authenticated private-file endpoint.
- Do not: add a public static route, email documents, or log their contents.

### Backup restore escalation and deployment rollback

- Detect: confirmed corruption/data loss or an incompatible deployment. Freeze
  writes and follow the backup/restore section above.
- Safe action: use the approved incident lead, verified backup, matching private
  files, and retained application artifact in an isolated target first.
- Do not: run improvised reverse migrations or restore over a live writable
  database. Verify preflights, indexes, `/ready`, runtime smoke, and sampled
  booking/payment/document integrity before reopening traffic.
