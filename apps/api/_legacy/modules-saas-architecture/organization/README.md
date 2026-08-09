# Organization Module

The heart of AcademyOS multi-campus architecture.

## Domain model

```
Academy
└── Branch 1
└── Branch 2
└── Branch 3
```

**Rule:** Every future module belongs to a **Branch**, never directly to an Academy.

## API

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/academies` | Create academy |
| GET | `/academies` | List academies (search + pagination) |
| GET | `/academies/:id` | Get academy with branches |
| PATCH | `/academies/:id` | Update academy |
| DELETE | `/academies/:id` | Delete academy |
| POST | `/branches` | Create branch |
| GET | `/branches` | List branches (filter by `academyId`, search + pagination) |
| GET | `/branches/:id` | Get branch |
| PATCH | `/branches/:id` | Update branch |
| DELETE | `/branches/:id` | Delete branch |

All routes require JWT authentication.

## Frontend

- `/organizations` — Academy list with search and pagination
- `/organizations/new` — Academy wizard (name → logo → contact → timezone → save)
- `/organizations/[academyId]` — Academy detail + branch list
- `/organizations/[academyId]/branches/new` — Branch creation
