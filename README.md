# Digital Wallet Service

Digital Wallet Service is a TypeScript/Node.js API built with Express. It uses PostgreSQL for transactional wallet data and MongoDB for audit logs and top-up requests.

This README is written for someone using the project for the first time. It covers setup, environment variables, database migration, seeding, test execution, Docker usage, and every currently exposed endpoint.

## Stack

- Node.js 22+
- Express 5
- TypeScript
- PostgreSQL
- MongoDB
- JWT authentication
- Joi request validation

## Features

- User registration and login
- Role-based access control for `admin` and `user`
- Wallet creation per user
- Admin wallet top-ups
- Wallet-to-wallet transfers
- User top-up requests
- Admin approval of top-up requests
- Audit log retrieval for admins
- Request ID propagation
- Idempotent top-up and transfer support via `Idempotency-Key`

## Project Structure

```text
src/
  config/              Environment and constants
  controllers/         HTTP controllers
  database/            PostgreSQL and MongoDB connection logic, SQL, scripts
  middleware/          Auth, validation, error handling, roles, request IDs
  models/              MongoDB models
  repositories/        Data access layer for PostgreSQL and MongoDB
  routes/              Express route definitions
  services/            Business logic
tests/                 Node test files
```

## Prerequisites

- Node.js 22 or later
- npm
- PostgreSQL running and reachable
- MongoDB running and reachable

## Environment Variables

Copy `.env.example` to `.env` and adjust values for your machine.

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Available variables:

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `NODE_ENV` | No | App environment | `development` |
| `PORT` | No | API port | `3000` |
| `POSTGRES_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:admin@localhost:5432/wallet_service` |
| `MONGODB_URL` | Yes | MongoDB connection string | `mongodb://localhost:27017/wallet_service` |
| `JWT_SECRET` | Yes | Secret used to sign JWTs | `super-secret-change-me` |
| `JWT_EXPIRES_IN` | No | JWT lifetime | `8h` |
| `TRANSFER_MIN_AMOUNT` | No | Smallest allowed transfer amount | `10` |
| `TRANSFER_MAX_AMOUNT` | No | Largest allowed transfer amount | `10000` |
| `DEFAULT_CURRENCY` | No | Default wallet currency | `TZS` |
| `ADMIN_EMAIL` | Yes | Seeded admin email | `admin@wallet.local` |
| `ADMIN_PASSWORD` | Yes | Seeded admin password | `Admin123!` |
| `DEMO_USER_PASSWORD` | Yes | Password used for seeded demo users | `User12345!` |

## Installation

```bash
npm install
```

## Running Locally

### 1. Start PostgreSQL and MongoDB

Make sure both databases are running before starting the API.

### 2. Install dependencies

```bash
npm install
```

### 3. Run database migrations

```bash
npm run migrate
```

This creates the PostgreSQL tables:

- `users`
- `wallets`
- `ledger_entries`

### 4. Seed initial data

```bash
npm run seed
```

The seed script creates these users if they do not already exist:

- Admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- `alice@wallet.local` using `DEMO_USER_PASSWORD`
- `bob@wallet.local` using `DEMO_USER_PASSWORD`

Each seeded user also gets a wallet in the configured default currency.

### 5. Start the development server

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

Base API path:

```text
http://localhost:3000/api/v1
```

Health check:

```text
http://localhost:3000/health
```

## Production Build

Build the project:

```bash
npm run build
```

Start the compiled server:

```bash
npm start
```

Important: when running outside Docker, `npm start` does not automatically run migration or seeding. Run `npm run migrate` and `npm run seed` first.

## Running With Docker

Bring up the full stack:

```bash
docker compose up --build
```

This starts:

- API on `http://localhost:3000`
- PostgreSQL on `localhost:5432`
- MongoDB on `localhost:27017`

The container startup command runs:

1. `npm run migrate`
2. `npm run seed`
3. `npm run start`

Stop the stack:

```bash
docker compose down
```

Remove containers and database volumes too:

```bash
docker compose down -v
```

## Running Tests

Run all tests:

```bash
npm test
```

What happens during `npm test`:

1. Test TypeScript files are compiled with `tsconfig.tests.json`
2. Node's built-in test runner executes the compiled tests from `.test-dist`

Current test files:

- `tests/http.test.ts`
- `tests/walletController.test.ts`

You can also build the test output only:

```bash
npm run build:test
```

## API Conventions

### Authentication

Protected routes require a bearer token:

```http
Authorization: Bearer <jwt-token>
```

### Request IDs

Every request receives an `X-Request-Id` response header.

You can provide your own:

```http
X-Request-Id: my-request-123
```

If you do not provide one, the service generates a UUID.

### Idempotency

These endpoints support idempotency:

- `POST /api/v1/wallets/top-ups`
- `POST /api/v1/wallets/transfers`

Use:

```http
Idempotency-Key: unique-client-generated-key
```

If the same logical request is repeated with the same key, the API returns the original result and sets `replayed: true`.

### Validation and Errors

Validation failures return status `400` with this shape:

```json
{
  "message": "Validation failed",
  "requestId": "7d8c8f02-8d9e-4f5d-8df7-ef8f8df51917",
  "details": [
    "\"email\" must be a valid email"
  ]
}
```

General error response shape:

```json
{
  "message": "Human readable error message",
  "requestId": "7d8c8f02-8d9e-4f5d-8df7-ef8f8df51917",
  "details": null
}
```

### Rate Limiting

The API applies a rate limit of 100 requests per minute per client.

## Seeded Accounts

After `npm run seed` or `docker compose up --build`, you can log in with:

| Role | Email | Password |
| --- | --- | --- |
| Admin | Value from `ADMIN_EMAIL` | Value from `ADMIN_PASSWORD` |
| User | `alice@wallet.local` | Value from `DEMO_USER_PASSWORD` |
| User | `bob@wallet.local` | Value from `DEMO_USER_PASSWORD` |

To get each user's UUID for admin operations, log in as that user or query the wallet endpoint using an existing token.

## Endpoints

Base URL:

```text
http://localhost:3000/api/v1
```

### Overview

| Method | Path | Auth | Role | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | No | Public | Health check |
| `POST` | `/api/v1/auth/register` | No | Public | Register a new user |
| `POST` | `/api/v1/auth/login` | No | Public | Log in an existing user |
| `GET` | `/api/v1/wallets/me` | Yes | User/Admin | Get wallet summary for current user |
| `POST` | `/api/v1/wallets/top-ups` | Yes | Admin | Top up a user's wallet |
| `POST` | `/api/v1/wallets/transfers` | Yes | User/Admin | Transfer funds to another user |
| `POST` | `/api/v1/wallets/top-up-requests` | Yes | User/Admin | Create a top-up request |
| `GET` | `/api/v1/wallets/top-up-requests` | Yes | Admin | List pending top-up requests |
| `POST` | `/api/v1/wallets/top-up-requests/:id/approve` | Yes | Admin | Approve a top-up request |
| `GET` | `/api/v1/audit-logs` | Yes | Admin | List recent audit logs |

## Endpoint Details

### 1. Health Check

`GET /health`

Response:

```json
{
  "status": "ok"
}
```

### 2. Register

`POST /api/v1/auth/register`

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPass123!"
}
```

Validation rules:

- `name`: string, required, 3-100 chars
- `email`: valid email, required
- `password`: string, required, 8-128 chars

Successful response: `201 Created`

```json
{
  "user": {
    "id": "3f387c8c-6d90-4c4f-94ca-7e4f3b7907ec",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "createdAt": "2026-04-23T08:30:00.000Z"
  },
  "token": "jwt-token"
}
```

Notes:

- A wallet is created automatically for the new user
- New registrations always receive the `user` role

Example:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Jane Doe\",\"email\":\"jane@example.com\",\"password\":\"StrongPass123!\"}"
```

### 3. Login

`POST /api/v1/auth/login`

Request body:

```json
{
  "email": "admin@wallet.local",
  "password": "Admin123!"
}
```

Successful response: `200 OK`

```json
{
  "user": {
    "id": "66a5f7c6-c533-45ab-9583-702d25a42783",
    "name": "System Admin",
    "email": "admin@wallet.local",
    "role": "admin",
    "createdAt": "2026-04-23T08:20:00.000Z"
  },
  "token": "jwt-token"
}
```

Example:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@wallet.local\",\"password\":\"Admin123!\"}"
```

### 4. Get My Wallet

`GET /api/v1/wallets/me`

Headers:

```http
Authorization: Bearer <jwt-token>
```

Optional query parameter:

- `userId`: only applied when the authenticated user is an admin

Successful response: `200 OK`

```json
{
  "wallet": {
    "id": "d9f43fa0-0976-414a-bb0b-cb9f24478039",
    "userId": "66a5f7c6-c533-45ab-9583-702d25a42783",
    "balance": 1500,
    "currency": "TZS",
    "createdAt": "2026-04-23T08:20:00.000Z",
    "updatedAt": "2026-04-23T09:10:00.000Z"
  },
  "recentTransactions": [
    {
      "id": "2aa8e10f-d866-4ea0-b4b5-7eb3ab58d6e3",
      "type": "top_up",
      "amount": 1000,
      "currency": "TZS",
      "reference": "topup:66a5f7c6-c533-45ab-9583-702d25a42783:demo-key",
      "description": "Admin top-up",
      "createdAt": "2026-04-23T09:10:00.000Z"
    }
  ]
}
```

Notes:

- Returns up to 10 recent ledger entries
- For non-admin users, the endpoint always returns their own wallet even if `userId` is supplied

### 5. Admin Top-Up

`POST /api/v1/wallets/top-ups`

Auth:

- Required
- Admin only

Headers:

```http
Authorization: Bearer <admin-jwt>
Idempotency-Key: topup-001
Content-Type: application/json
```

Request body:

```json
{
  "userId": "1b2e4992-e5c3-4768-a580-a5b82cb184fa",
  "amount": 500,
  "reason": "Promotional credit"
}
```

Validation rules:

- `userId`: UUID v4, required
- `amount`: positive number, required
- `reason`: optional string, max 255 chars

Successful response:

- `201 Created` for a new top-up
- `200 OK` when replayed using the same idempotency key

```json
{
  "wallet": {
    "id": "07ee8fb0-b1f8-4362-8cc9-3cbd10e06f9d",
    "userId": "1b2e4992-e5c3-4768-a580-a5b82cb184fa",
    "balance": 500,
    "currency": "TZS",
    "createdAt": "2026-04-23T08:25:00.000Z",
    "updatedAt": "2026-04-23T09:20:00.000Z"
  },
  "reference": "topup:1b2e4992-e5c3-4768-a580-a5b82cb184fa:topup-001",
  "replayed": false
}
```

### 6. Transfer Funds

`POST /api/v1/wallets/transfers`

Auth:

- Required
- User or admin

Headers:

```http
Authorization: Bearer <jwt-token>
Idempotency-Key: transfer-001
Content-Type: application/json
```

Request body:

```json
{
  "recipientUserId": "7ad9f0a0-d7e2-4d83-8ff9-11d1736177b1",
  "amount": 200,
  "note": "Dinner split"
}
```

Validation rules:

- `recipientUserId`: UUID v4, required
- `amount`: positive number, required
- `note`: optional string, max 255 chars

Business rules:

- Sender cannot transfer to self
- Amount must be between `TRANSFER_MIN_AMOUNT` and `TRANSFER_MAX_AMOUNT`
- Sender must have enough balance

Successful response:

- `201 Created` for a new transfer
- `200 OK` when replayed using the same idempotency key

```json
{
  "senderWallet": {
    "id": "07ee8fb0-b1f8-4362-8cc9-3cbd10e06f9d",
    "userId": "1b2e4992-e5c3-4768-a580-a5b82cb184fa",
    "balance": 300,
    "currency": "TZS",
    "createdAt": "2026-04-23T08:25:00.000Z",
    "updatedAt": "2026-04-23T09:25:00.000Z"
  },
  "receiverWallet": {
    "id": "28031dc9-c352-4856-9a28-f8dd3e071f3b",
    "userId": "7ad9f0a0-d7e2-4d83-8ff9-11d1736177b1",
    "balance": 200,
    "currency": "TZS",
    "createdAt": "2026-04-23T08:27:00.000Z",
    "updatedAt": "2026-04-23T09:25:00.000Z"
  },
  "reference": "transfer:1b2e4992-e5c3-4768-a580-a5b82cb184fa:7ad9f0a0-d7e2-4d83-8ff9-11d1736177b1:transfer-001",
  "replayed": false
}
```

Common errors:

- `400` invalid amount or self-transfer
- `404` sender/recipient user or wallet not found
- `409` insufficient wallet balance

### 7. Create Top-Up Request

`POST /api/v1/wallets/top-up-requests`

Auth:

- Required
- User or admin

Request body:

```json
{
  "amount": 1000,
  "reason": "Need funds for testing"
}
```

Successful response: `201 Created`

```json
{
  "id": "68087dca343d1c680cbe1a11",
  "requesterUserId": "1b2e4992-e5c3-4768-a580-a5b82cb184fa",
  "amount": 1000,
  "currency": "TZS",
  "reason": "Need funds for testing",
  "status": "pending",
  "createdAt": "2026-04-23T09:30:00.000Z",
  "updatedAt": "2026-04-23T09:30:00.000Z"
}
```

### 8. List Pending Top-Up Requests

`GET /api/v1/wallets/top-up-requests`

Auth:

- Required
- Admin only

Successful response: `200 OK`

```json
[
  {
    "id": "68087dca343d1c680cbe1a11",
    "requesterUserId": "1b2e4992-e5c3-4768-a580-a5b82cb184fa",
    "amount": 1000,
    "currency": "TZS",
    "reason": "Need funds for testing",
    "status": "pending",
    "createdAt": "2026-04-23T09:30:00.000Z",
    "updatedAt": "2026-04-23T09:30:00.000Z"
  }
]
```

### 9. Approve Top-Up Request

`POST /api/v1/wallets/top-up-requests/:id/approve`

Auth:

- Required
- Admin only

Path parameter:

- `id`: MongoDB ObjectId string of the top-up request

Successful response: `200 OK`

```json
{
  "request": {
    "id": "68087dca343d1c680cbe1a11",
    "requesterUserId": "1b2e4992-e5c3-4768-a580-a5b82cb184fa",
    "amount": 1000,
    "currency": "TZS",
    "reason": "Need funds for testing",
    "status": "approved",
    "reviewedByUserId": "66a5f7c6-c533-45ab-9583-702d25a42783",
    "reviewedAt": "2026-04-23T09:35:00.000Z",
    "createdAt": "2026-04-23T09:30:00.000Z",
    "updatedAt": "2026-04-23T09:35:00.000Z"
  },
  "wallet": {
    "id": "07ee8fb0-b1f8-4362-8cc9-3cbd10e06f9d",
    "userId": "1b2e4992-e5c3-4768-a580-a5b82cb184fa",
    "balance": 1300,
    "currency": "TZS",
    "createdAt": "2026-04-23T08:25:00.000Z",
    "updatedAt": "2026-04-23T09:35:00.000Z"
  },
  "reference": "topup:1b2e4992-e5c3-4768-a580-a5b82cb184fa:68087dca343d1c680cbe1a11"
}
```

Common errors:

- `404` top-up request not found
- `409` top-up request is no longer pending

### 10. List Recent Audit Logs

`GET /api/v1/audit-logs`

Auth:

- Required
- Admin only

Optional query parameter:

- `limit`: number of records to return, default `50`

Example:

```text
GET /api/v1/audit-logs?limit=20
```

Successful response: `200 OK`

```json
[
  {
    "actorUserId": "66a5f7c6-c533-45ab-9583-702d25a42783",
    "action": "wallet_top_up",
    "entityType": "wallet",
    "entityId": "07ee8fb0-b1f8-4362-8cc9-3cbd10e06f9d",
    "status": "success",
    "metadata": {
      "amount": 500,
      "targetUserId": "1b2e4992-e5c3-4768-a580-a5b82cb184fa",
      "reference": "topup:1b2e4992-e5c3-4768-a580-a5b82cb184fa:topup-001",
      "replayed": false
    }
  }
]
```

## Typical First-Time Flow

### Option A: Local

1. Start PostgreSQL and MongoDB
2. Copy `.env.example` to `.env`
3. Run `npm install`
4. Run `npm run migrate`
5. Run `npm run seed`
6. Run `npm run dev`
7. Log in with the seeded admin account
8. Log in with Alice or Bob for user-level testing

### Option B: Docker

1. Run `docker compose up --build`
2. Wait for the app container to finish migration and seeding
3. Use the API at `http://localhost:3000`

## Useful cURL Examples

### Login as admin

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@wallet.local\",\"password\":\"Admin123!\"}"
```

### Get your wallet

```bash
curl http://localhost:3000/api/v1/wallets/me \
  -H "Authorization: Bearer <jwt-token>"
```

### Admin top-up

```bash
curl -X POST http://localhost:3000/api/v1/wallets/top-ups \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: topup-001" \
  -d "{\"userId\":\"<target-user-uuid>\",\"amount\":500,\"reason\":\"Manual credit\"}"
```

### Transfer funds

```bash
curl -X POST http://localhost:3000/api/v1/wallets/transfers \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: transfer-001" \
  -d "{\"recipientUserId\":\"<recipient-user-uuid>\",\"amount\":100,\"note\":\"Test transfer\"}"
```

## Notes

- PostgreSQL stores users, wallets, and ledger entries
- MongoDB stores audit logs and top-up requests
- The app currently inserts a sample document into a MongoDB `Test` collection during startup as part of the existing connection bootstrap
- The `/soap` path is prepared to accept XML content types, but there are no implemented SOAP operations in the current codebase

## Available npm Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the API in watch mode using `tsx` |
| `npm run build` | Compile application TypeScript to `dist/` |
| `npm start` | Start the compiled server from `dist/` |
| `npm run build:test` | Compile test files to `.test-dist/` |
| `npm test` | Build test files and run the Node test suite |
| `npm run migrate` | Execute SQL migrations against PostgreSQL |
| `npm run seed` | Seed initial users and wallets |

## Troubleshooting

### App fails to start

Check:

- PostgreSQL is reachable using `POSTGRES_URL`
- MongoDB is reachable using `MONGODB_URL`
- Required environment variables are present

### Login fails for seeded users

Check:

- You ran `npm run seed`
- Your `.env` values match the credentials you are using
- The Docker stack was rebuilt after env changes if you are using Docker

### Transfers fail

Check:

- The sender has enough balance
- The amount is within `TRANSFER_MIN_AMOUNT` and `TRANSFER_MAX_AMOUNT`
- The recipient user exists

## License

ISC
