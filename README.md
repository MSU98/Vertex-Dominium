# Vertex Dominium

React + TypeScript + Vite foundation with Firebase (Auth, Firestore, Storage) and role-based access control.

## Setup
- Install deps: `npm install`
- Copy env: `cp .env.example .env` and fill Firebase values (project Settings → General → SDK setup).
- Dev server: `npm run dev`
- Type check + build: `npm run build`
- Lint: `npm run lint`

## Firebase
- Enable Email/Password auth in Firebase Console.
- Create Firestore database (production or test mode).
- Optional: Enable Storage bucket if you plan to upload assets soon.
- User documents live in `users/{uid}` with fields: uid, email, role, membershipPlan, membershipStatus, onboardingComplete, createdAt.

## Deploy (Firebase Hosting)
- Install tools: `npm install -g firebase-tools`
- Login: `firebase login`
- Init hosting (once): `firebase init hosting` → `dist` as public folder → configure as SPA.
- Build & deploy: `npm run build && firebase deploy --only hosting`

## Structure
- `src/app` app entry & layout
- `src/auth` auth context + guards
- `src/components` shared UI
- `src/features` pages (dashboard, courses, feed, forum, auth, home)
- `src/lib` firebase client
- `src/routes` path constants
- `src/styles` global theme
- `src/types` shared types

## Notes
- Default member roles: Initium, Ascensio, Dominus, Admin, Official, Curated.
- AuthContext hydrates user profile from Firestore and exposes role + membershipStatus for guards.
- Dashboard routes are wrapped with RequireAuth and RequireRole; update allowed roles as needed.
