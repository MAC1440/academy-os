# Data Change and Test Conventions

## Prisma migrations

- Make every schema change through Prisma migrations; do not use manual database
  changes as a substitute.
- Name migrations after the business capability, for example
  `add-organization-membership`, not after a framework task.
- Create a migration with:

  ```bash
  npm run prisma:migrate --workspace=api -- --name <business-capability>
  ```

- Review the generated SQL and run API tests before applying it anywhere beyond
  local development.
- New operational models must include lifecycle fields required by the MVP
  checkpoint that introduces them.

## Seed data

- Seeds must be idempotent: running them twice produces the same system data.
- Only seed data required for application operation or local development, such
  as Platform Super Admin, system roles, and permission definitions.
- Keep business demo data separate from system seeds.

## Test data

- Test data belongs beside the module test suite or in a shared test factory.
- Tests create their own records and must not depend on a developer database.
- Cover authorization, validation, and tenant-boundary cases for every new
  endpoint in addition to its expected success path.
