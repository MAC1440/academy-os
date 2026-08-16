# AcademyOS deployment runbook

## What deploys automatically

- GitHub Actions validates formatting, regenerates Prisma Client, and builds the API and web app for every pull request and every push to `main`.
- Vercel builds and deploys the connected web project from Git.
- Railway builds the API, runs committed Prisma migrations before release, waits for `GET /health`, and only then starts the API.

## One-time dashboard configuration

1. In Railway, keep the API service rooted at the repository root. The committed `railway.json` supplies its build, migration, start, and health-check commands.
2. In Vercel, keep the web project rooted at `apps/web` and ensure **Include source files outside the Root Directory** is enabled for the shared workspace package.
3. In GitHub, protect `main` and require the **CI / Format and build** status check before merging pull requests.

## Release behaviour

- `prisma migrate deploy` is safe to run automatically: it only applies migrations already committed to the repository.
- Do not run `prisma:seed` automatically. The seed changes system-role defaults and should be run intentionally whenever a release explicitly changes seed data or permission definitions.
- A failed migration or failed `/health` check stops the Railway release instead of starting a partially-upgraded API.
