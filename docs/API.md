# Kasthara REST API

All application endpoints live under `/api/v1`, return JSON, require authentication unless noted, and use secure HttpOnly cookies for browser auth. React Native clients can send and store the same cookies or adapt the login response into a native cookie jar.

## Response Shape

Successful response:

```json
{ "success": true, "data": {}, "message": "Order retrieved successfully" }
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "phone": ["Phone number is required"] }
}
```

## Authentication

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Login body:

```json
{ "email": "admin@kasthara.local", "password": "password123" }
```

## Orders

- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id`
- `GET /api/v1/orders/by-number/:orderNumber`
- `PATCH /api/v1/orders/:id`
- `POST /api/v1/orders/:id/status`
- `POST /api/v1/orders/:id/payments`
- `GET /api/v1/orders/:id/payments`
- `POST /api/v1/orders/:id/print-log`

Order list supports `page`, `pageSize`, `search`, `orderStage`, `paymentStatus`, `deliveryMethod`, `staffId`, `productId`, `dateFrom`, `dateTo`, `sortBy`, and `sortDir`.

## Customers

- `GET /api/v1/customers/search?q=9801234567`
- `GET /api/v1/customers/:id`

Search checks customer name, full normalized phone number, and last four phone digits.

## Dashboard And Work Queues

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/work-queues/today`

Both endpoints use live database queries.

## Products

- `GET /api/v1/products`
- `POST /api/v1/products` admin only

## Import, Export, Settings

- `POST /api/v1/import/preview` admin only, multipart form field `file`
- `POST /api/v1/import/commit` admin only, imports preview rows with no errors
- `GET /api/v1/export/orders`
- `GET /api/v1/settings/label`
- `PATCH /api/v1/settings/label` admin only

## Privacy

QR codes contain only `KASORDER:<orderNumber>`. Customer names, phone numbers, and addresses are never embedded in QR values. All scanned order lookups must authenticate before returning order data.
