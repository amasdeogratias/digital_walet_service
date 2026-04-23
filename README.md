# Digital Wallet Service

Backend service for a digital wallet take-home task using Node.js, Express, PostgreSQL, and MongoDB.

## Docker Setup

### Prerequisites

- Docker
- Docker Compose

### Run the full stack

```bash
docker compose up --build
```

This starts:

- `app` on `http://localhost:3000`
- `postgres` on `localhost:5432`
- `mongo` on `localhost:27017`

The app container runs SQL migrations automatically before starting the API.

### Stop the stack

```bash
docker compose down
```

To remove the database volumes too:

```bash
docker compose down -v
```

## Environment

The Docker stack uses these container-native connection strings:

- `POSTGRES_URL=postgresql://postgres:admin@postgres:5432/wallet_service`
- `MONGODB_URL=mongodb://mongo:27017/wallet_service`

## API Base URL

```text
http://localhost:3000/api/v1
```

Health endpoint:

```text
http://localhost:3000/health
```
