# Vertex Dominium

Vertex Dominium is a premium membership platform built as a modern MVP.

The project is developed using React + TypeScript + Vite and integrates Firebase for Authentication, Firestore, Storage, and Hosting. The platform uses role-based access control (RBAC) to manage permissions and protected routes.

The purpose of this project is to deliver a working MVP that demonstrates core functionality, technical competence, secure configuration handling, and a clear development workflow.

---

## Tech Stack

- React
- TypeScript
- Vite
- Firebase (Authentication, Firestore, Storage, Hosting)
- Git & GitHub

---

## Setup

1) Install dependencies

npm install

2) Environment variables (required)

This project requires Firebase environment variables to run.

- Copy .env.example to .env
- Fill in all VITE_FIREBASE_* values from:
  Firebase Console → Project settings → General → SDK setup
- The .env file must never be committed (it is ignored via .gitignore)

If any required environment variable is missing, the application will display a "Connect Firebase" screen instead of loading authentication.

Windows (PowerShell):
Copy-Item .env.example .env

macOS / Linux:
cp .env.example .env

3) Run development server

npm run dev

4) Build & lint

npm run build
npm run lint

---

## Firebase Setup (Console)

Authentication:
- Enable Email/Password under Authentication → Sign-in method

Firestore:
- Create a Firestore database (test or production mode)

Storage (optional):
- Enable Storage if file uploads will be used later

---

## Firestore User Model

User profiles are stored in:

users/{uid}

Recommended fields:
- uid
- email
- role
- membershipPlan
- membershipStatus
- onboardingComplete
- createdAt

---

## Deploy (Firebase Hosting)

Install Firebase CLI:
npm install -g firebase-tools
firebase login

Initialize hosting (first time only):
firebase init hosting

Configuration during setup:
- Public directory: dist
- Configure as Single Page Application (SPA): Yes

Build & deploy:
npm run build
firebase deploy --only hosting

---

## Project Structure

src/
├── app/          Application entry and layout
├── auth/         Authentication context and route guards
├── components    Shared UI components
├── features      Pages (dashboard, courses, feed, forum, auth, home)
├── lib           Firebase client and helpers
├── routes        Route constants
├── styles        Global styles and theme
└── types         Shared TypeScript types

---

## Roles & Access Control

Default roles:
- Initium
- Ascensio
- Dominus
- Admin
- Official
- Curated

The AuthContext hydrates the user profile from Firestore and exposes role and membershipStatus.
Protected routes are wrapped using RequireAuth and RequireRole.

---

## MVP Scope

Included:
- Firebase Authentication (Email/Password)
- Firestore user profiles
- Role-based access control
- Protected routes
- Firebase Hosting deployment

Not included in MVP:
- BankID (placeholder only)
- Payment systems (Klarna / Swish)
- Full course, forum, or marketplace functionality

---

## Project Goal

Build a working MVP for Vertex Dominium that demonstrates:
- core platform functionality
- technical understanding
- secure handling of environment variables
- a clear and structured development workflow
