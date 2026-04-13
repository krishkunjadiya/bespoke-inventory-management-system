# Inventory Backend (Phase 1)

Backend implementation started from the V2 system guide with these foundations:

- Modular monolith Express architecture
- JWT auth with refresh token rotation
- Store-level tenant isolation middleware
- Product CRUD with per-store uniqueness and soft delete
- Inventory adjustment + movement ledger
- Transaction-safe sales flow with:
  - idempotency key handling
  - atomic invoice counter
  - guarded stock decrement
- Dashboard report endpoint

## Run

1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Permanent User + Data Scope

- Create or sync permanent admin user: `npm run user:permanent`
- Reassign all existing data to permanent user's store scope: `npm run data:assign-permanent`
- Delete all users, create a new permanent owner, and adopt all existing data: `npm run user:reset-and-adopt`

Use this when data exists but does not appear for the logged-in permanent user due to store-level tenant filtering.

## API Base

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/logout`
- `GET|POST|PATCH|DELETE /api/v1/products`
- `GET /api/v1/inventory/movements`
- `GET /api/v1/inventory/low-stock`
- `POST /api/v1/inventory/adjustments`
- `POST|GET /api/v1/sales`
- `GET /api/v1/sales/:id`
- `GET /api/v1/reports/dashboard`

## Notes

- `POST /api/v1/sales` requires `Idempotency-Key` header.
- Purchases endpoints are scaffolded and return 501 for the next pass.
- Current implementation uses a single `storeId` per user account.
