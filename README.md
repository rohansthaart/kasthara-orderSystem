# Kasthara Order System

Production-ready Next.js order management foundation for Kasthara, a Nepal-based custom laser-engraving and personalized gift business.

## Architecture

- Next.js App Router with TypeScript strict mode
- PostgreSQL with Prisma ORM and generated migrations
- JWT authentication with secure HttpOnly cookies
- Role-based access for `ADMIN` and `STAFF`
- REST API under `/api/v1` for web and React Native clients
- Tailwind CSS with shadcn-style owned UI components
- React Hook Form and Zod validation
- ExcelJS import preview and XLSX export
- QR labels containing safe order identifiers only
- Docker Compose for local PostgreSQL

## Database Schema

The Prisma schema includes normalized models for users, customers, products, orders, order items, payments, order status history, print logs, audit logs, daily order sequences, and label settings.

Important rules:

- Additional payments are stored as separate `Payment` rows.
- `amountPaid` is recalculated from valid payments.
- `remainingBalance = totalPrice - amountPaid`.
- Payment status is separate from order stage.
- Daily order numbers use `DailyOrderSequence` for atomic sequence increments.
- Cancellations are soft state through `orderStage`, `cancelledAt`, and audit logs.

## Folder Structure

```text
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  app/
    api/v1/
    (app)/
    login/
  components/
    ui/
  lib/
docs/
  API.md
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Copy and edit env values:

```bash
cp .env.example .env
```

4. Generate Prisma client and migrate:

```bash
npm run db:generate
npm run db:migrate
```

5. Seed sample users, products, customers, orders, and payments:

```bash
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

Default users:

- Admin: `admin@kasthara.local` / `password123`
- Staff: `staff@kasthara.local` / `password123`

## Core Workflows

- Staff login
- Fast order creation with paste parsing
- Duplicate customer warning by normalized Nepal phone number
- Unique order number generation in `KAS-YYMMDD-001` format
- Advance and additional payments as payment records
- Order search by number, phone, last four digits, name, and address
- Status timeline and audit history
- Thermal 60 mm x 40 mm label preview and browser print
- QR value generation as `KASORDER:<orderNumber>`
- Dashboard and work queues powered by database queries
- Admin Excel import preview and current-order XLSX export

## Testing

```bash
npm test
npm run lint
npm run build
```

Tests cover order number formatting, phone normalization, balance and payment-status calculation, QR value generation, legacy status mapping, and Excel import validation.

## Deployment Notes

- Use managed PostgreSQL in production.
- Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Run `npm run db:migrate` during release.
- Keep `APP_URL`, `DEFAULT_TIMEZONE=Asia/Kathmandu`, and `DEFAULT_CURRENCY=NPR` set.
- Serve behind HTTPS so secure cookies work correctly.
- Do not expose `/api/v1/*` without authentication checks.

See [docs/API.md](docs/API.md) for endpoint details.
