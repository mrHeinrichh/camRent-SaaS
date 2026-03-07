<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CamRent SaaS

This repo is now split into two packages:

- `frontend/`: Vite + React + TypeScript + Zustand
- `backend/`: Express + TypeScript + MongoDB + Cloudinary

## Run locally

**Prerequisites:** Node.js and MongoDB

1. Install frontend dependencies:
   `npm install --prefix frontend`
2. Install backend dependencies:
   `npm install --prefix backend`
3. Create env files:
   - `cp frontend/.env.example frontend/.env`
   - `cp backend/.env.example backend/.env`
4. Start the backend:
   `npm run dev:backend`
5. Start the frontend:
   `npm run dev:frontend`

The Vite frontend proxies `/api/*` requests to `http://localhost:3000` by default.

## API docs

With the backend running, open:

- `http://localhost:3000/docs`

This serves a Swagger-style API viewer backed by:

- `http://localhost:3000/docs/openapi.json`

## Admin accounts

There are two ways to get an admin account:

1. Seeded default admin on a fresh database:
   - email: `admin@camrent.com`
   - password: `admin123`

2. Create your own admin account:

```bash
cd backend
npm run create:admin -- --email you@example.com --password strong-password --name "Super Admin"
```
