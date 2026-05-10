# MeetPlan

A scheduling tool for 1:1 meetings. The host publishes their available time slots; each participant picks the times that work for them, and the system automatically finds non-overlapping assignment combinations that cover as many participants as possible.

---

## Features

- **Event creation** — Select dates on a calendar and paint time slots with drag gestures
- **Share link** — Participants respond without signing in via a single link (anonymous token-based editing supported)
- **Availability matrix** — Cross-table of participants × slots for a quick overview of all responses
- **Auto-assignment suggestions** — Automatically computes non-overlapping combinations that maximize participant coverage
- **Slot editing** — Edit time slots after creation; only affected responses are selectively cleaned up
- **Mobile-optimized** — Touch drag painting, app bar navigation, skeleton loading states

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Firebase Cloud Functions (Node 20) |
| Database | Cloud Firestore |
| Auth | Firebase Authentication (Google) |
| Build / Packages | pnpm workspaces (monorepo) |
| Testing | Vitest (unit), Playwright (E2E), Firebase Emulator (rules) |

---

## Project Structure

```
meetplan/
├── apps/web/          # Vite + React client
├── functions/         # Cloud Functions
│   └── src/
│       ├── submitResponse.ts
│       ├── getResponse.ts
│       ├── deleteEvent.ts
│       └── updateEventSlots.ts
├── packages/shared/   # Shared types, validation, time utilities, matching algorithm
└── tests/rules/       # Firestore security rules tests
```

---

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Firebase CLI: `npm i -g firebase-tools`

### Initial Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill .env.local with your Firebase Web app config and set VITE_USE_EMULATOR=true
```

### Running Locally

```bash
# Terminal 1 — Firebase emulators
firebase emulators:start

# Terminal 2 — Web dev server
pnpm dev
```

| URL | Description |
|---|---|
| http://localhost:5173 | Web app |
| http://localhost:4000 | Firebase Emulator UI |

---

## Testing

```bash
# All unit tests
pnpm test

# E2E (requires emulators + dev server running)
pnpm --filter web test:e2e

# Firestore security rules (requires emulator)
pnpm --filter rules-tests test

# Functions unit tests
pnpm --filter functions test
```

---

## Deployment

### One-time Setup

1. Create a Firebase project with Hosting, Firestore, Functions, and Authentication enabled
2. Authentication → Sign-in method → enable Google
3. Firestore location: `asia-northeast3`
4. `firebase login` → `firebase use --add` → select your project
5. Add your deployed domain to the Authentication authorized domains list
6. Register a Web app and save its config to `apps/web/.env.production` (set `VITE_USE_EMULATOR=false`)

### Deploy

```bash
pnpm deploy
```

Runs `web build → functions build → firebase deploy` in sequence.
For partial deploys:

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions
```

---

## Key Flow Verification

### Participant Response Flow

1. Start emulators and dev server
2. Sign in as host → create an event → copy the share link from the result page
3. Open the link in **a different browser or incognito window**
4. Enter name + phone → select slots → submit
   - Anonymous submit: save the edit link from the success screen → revisiting it pre-fills the response
   - Signed-in submit: revisiting `/e/<eventId>` with the same account auto-fills the response
5. Confirm `events/<id>/responses` sub-collection in the Firestore Emulator UI

### Host Result View

1. After collecting participant responses, sign in as host → Dashboard → click the event
2. **Availability matrix** tab: participant × slot cross-table with per-slot coverage counts
3. **Auto-assignment suggestions** tab: non-overlapping combinations (up to 20), unmatched participants shown
4. Close / Reopen toggle — closed events show a lock screen to participants

---

## Security Verification

| Check | How to Verify |
|---|---|
| Non-owner result page access | Navigate to `/events/:id/result` with a different account → redirected to dashboard |
| Cross-participant response isolation | Run Firestore rules tests: `pnpm --filter rules-tests test` |
| Wrong token on getResponse | Returns `permission-denied` |
| Submit to closed event | Returns `event-closed` |
