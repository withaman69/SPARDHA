# CESCO Sports Championship Portal
Two separate apps: /backend (Express + Prisma + PostgreSQL) and /frontend (React + Vite + TypeScript).

## Run
1. Backend: cd backend, cp .env.example .env, fill DATABASE_URL (Neon or local), then
   npm install, npx prisma migrate dev --name init, npm run seed, npm run dev  (port 4000)
2. Frontend: cd frontend, npm install, npm run dev  (port 5173). If the API is offline it shows demo data.
3. Admin: open /admin. Email and password come from the ADMIN_EMAIL and ADMIN_PASSWORD you set in .env before seeding.

## Edit
Colours: frontend/src/styles.css (:root variables, taken from the PRD). Rules text: RULES in frontend/src/App.tsx.
Points system: POINTS in backend/src/index.js.

## Security in place
bcrypt password hashing, JWT (12h) sent as Bearer token, helmet, CORS locked to FRONTEND_URL, rate limits (global and login),
input validation, Prisma parameterised queries (no SQL injection), body size limit, React escapes all output.

## Not built yet
Three.js hero, gallery upload (Cloudinary), team profiles, results page, Match Center timeline UI, global search, calendar view,
Redux and Tailwind (plain CSS used), full admin pages for teams/sports/gallery. Backend has the score event endpoint ready.
