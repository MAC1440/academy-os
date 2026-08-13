# AcademyOS

Multi-tenant school-management platform for Pakistan-based organizations and
their branches.

## Local setup

1. Install dependencies with `npm install`.
2. Start PostgreSQL with `docker compose up -d`.
3. Create `apps/api/.env` using `.env.example` as the source. Set
   `DATABASE_URL`, `JWT_SECRET`, and `REFRESH_SECRET`.
4. Generate Prisma Client with `npm run prisma:generate --workspace=api`.
5. Run the API on port 3000 with `npm run dev --workspace=api`.
6. In a second terminal, run the web app on port 3001 with
   `npm run dev --workspace=web -- --port 3001`.

The web application expects `NEXT_PUBLIC_API_URL=http://localhost:3000`.

## Production deployment

- Deploy `apps/web` to Vercel with `NEXT_PUBLIC_API_URL` set to the public API URL.
- Deploy the repository root as one Railway API service. The committed
  [`railway.toml`](railway.toml) builds the API, applies committed Prisma
  migrations before deployment, starts the API, and health-checks `/health`.
- Add a Railway PostgreSQL service and set the API service's `DATABASE_URL` to
  its reference variable. Also set strong, unique `JWT_SECRET` and
  `REFRESH_SECRET` values, `NODE_ENV=production`, and `ALLOWED_ORIGINS` to the
  production Vercel URL.
- On a brand-new database only, run `npm run prisma:seed --workspace=api` once
  from Railway. The seed creates the initial administrator and academic reference
  data, but is now safe to rerun without replacing an existing administrator's
  credentials.

## Quality commands

| Command                                       | Purpose                                 |
| --------------------------------------------- | --------------------------------------- |
| `npm run lint`                                | Lint API and web workspaces.            |
| `npm run test --workspace=api -- --runInBand` | Run API unit tests.                     |
| `npm run build`                               | Build API and web production artifacts. |
| `npm run format:check`                        | Check repository formatting.            |

## API conventions

Successful domain endpoints return:

```json
{ "success": true, "message": "…", "data": {}, "meta": null, "errors": null }
```

Errors use the same envelope with `success: false`, `data: null`, and a list
of validation or request errors. Collection endpoints use `meta` for page,
limit, total, and total pages.

## Repository structure

- `apps/api` — NestJS API and Prisma schema
- `apps/web` — Next.js application
- `packages` — shared types and UI packages
- `docs` — architecture and delivery documentation

See [the MVP delivery checklist](docs/mvp-delivery-checklist.md) for the
checkpoint-based implementation plan.
See [data-change conventions](docs/data-change-conventions.md) before adding
or changing persisted data.
