# Shripad PG — Production Backend API

Production backend service built with Node.js, Express, TypeScript, and MongoDB.

## Folder Architecture

```
backend/
├── src/
│   ├── config/        # Environment and DB configuration
│   ├── controllers/   # Route controllers (Request/Response handlers)
│   ├── middleware/    # Auth, validation, error handling middlewares
│   ├── models/        # Database models & schemas
│   ├── routes/        # Express API endpoints
│   ├── services/      # Business & domain logic services
│   └── index.ts       # Server entry point
├── .env
├── package.json
└── tsconfig.json
```

## Running Backend

```bash
cd backend
npm install
npm run dev
```
