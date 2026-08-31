# Frontend dependency risk register

Last reviewed: 2026-08-29

## Resolved runtime risk

- `xlsx@0.18.5` was removed. Its Excel export driver was replaced with
  `write-excel-file/browser`, which has no advisory in the current npm audit.
- `react-router-dom` was updated from `6.20.0` to the latest compatible v6
  release (`6.30.6`) without introducing a v7 architecture migration.

## Temporarily accepted risk

### Create React App toolchain

The remaining critical/high transitive findings such as `shell-quote`,
`websocket-driver`, webpack-dev-server, Babel, PostCSS, SVGO and Workbox are
reached through `react-scripts@5.0.1`. They execute while developing, testing,
or producing the static build; they are not a Node.js server deployed with the
generated frontend assets. Production must deploy only `frontend/build`, not
`react-scripts start` or webpack-dev-server.

Decision: accept temporarily and track CRA-to-Vite (or another maintained
toolchain) as a separate migration. Do not use `npm audit fix --force`.

### React Router v6

The current advisory is fixed only in React Router v7. The SSR hydration path
is not used because this application is a client-rendered SPA. The open
redirect path is constrained by current usage: navigation destinations are
static internal routes or internal routes containing application entity IDs;
the application does not pass arbitrary URLs from query strings, form input,
or API responses directly to `navigate`, `Link`, or `Navigate`.

Decision: accept temporarily with these constraints. Any feature that adds a
return URL or server-provided navigation target must validate that it is a
single-leading-slash internal path and must reject backslashes and
protocol-relative URLs. React Router v7 migration remains tracked technical
debt.

## Removal rules

- Do not reintroduce `xlsx` without using a release outside its vulnerable
  ranges and repeating the export contract tests.
- Re-run `npm audit --omit=dev`, the production build, and frontend tests after
  dependency or lockfile changes.
- Re-evaluate this acceptance before deploying a frontend Node server, SSR,
  or user-controlled redirect/return URL feature.
