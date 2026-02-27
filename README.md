# Vertex Dominium

Vite + React + TypeScript + Firebase MVP for a public marketing site and a paywalled member portal.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill all `VITE_FIREBASE_*` values.
3. Start dev server:

```bash
npm run dev
```

## Route Map

### Public Routes
- `/` - Landing page (Hero, what it is, tiers, CTA, contact)
- `/about` - About page
- `/contact` - Contact page
- `/login` - Login
- `/register` - Register

### Auth Routes
- `/membership` - Membership selection
- `/onboarding/initium` - Initium onboarding
- `/onboarding/ascensio` - Ascensio onboarding
- `/onboarding/dominus` - Dominus onboarding
- `/application-pending` - Dominus pending state

### Member Portal Routes (`/app/*`)
- `/app/home` - Member home
- `/app/dashboard` - Dashboard module
- `/app/courses` - Courses module
- `/app/feed` - Feed module
- `/app/forum` - Forum module
- `/app/profile` - Profile module
- `/app/dominus` - Dominus-only placeholder module
- `/app/admin/dn-applications` - Admin applications panel (admin only)

## Access

- Unauthenticated users can access only public routes.
- Authenticated users always land on `/app/home` after login/register.
- Module access uses `membershipPlan + membershipStatus`.
- Locked module routes redirect to `/membership`.
- Admin route uses role guard.
