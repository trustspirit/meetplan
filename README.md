# MeetPlan

A simple scheduler for 1:1 meetings. The host publishes their available times; each participant picks the times they can make, and the system auto-suggests non-overlapping assignment combinations (one slot per participant).

## Development

### Requirements
- Node.js 20+
- pnpm 9+
- Firebase CLI (`npm i -g firebase-tools`)

### Initial setup
```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill .env.local with your Firebase Web app config + VITE_USE_EMULATOR=true
```

### Local run (emulators + dev)
```bash
# Terminal 1
firebase emulators:start

# Terminal 2
pnpm dev
```
- Web: http://localhost:5173
- Firebase Emulator UI: http://localhost:4000

### Tests
```bash
pnpm test                      # All workspace unit tests
pnpm --filter web test:e2e     # E2E (requires emulators + dev)
pnpm --filter rules-tests test # Firestore security rules (requires emulator)
```

## Project structure
- `apps/web` — Vite + React client
- `functions` — Cloud Functions (`submitResponse`, `getResponse`, `deleteEvent`, `updateEventSlots`)
- `packages/shared` — domain types, zod validation, time/slot utilities, callable types, matching algorithm
- `tests/rules` — Firestore security rules tests

## Design doc
`docs/specs/2026-04-20-meetplan-design.md`

## Manual verification — participant response flow (Plan 2)

End-to-end check of the participant submission flow:

1. Build functions: `pnpm --filter functions build`
2. Start emulators: `firebase emulators:start` (picks up `functions/lib/index.js` automatically)
3. Start dev server: `pnpm dev`
4. Sign in as the host and create an event
5. Copy the share link from the event result page — format `http://localhost:5173/e/<eventId>`
6. Open the link in **another browser or an incognito window** as a participant:
   - Enter name + phone → check slots → submit
   - Anonymous submit: verify the edit URL on the success screen and copy it
   - Reopen the edit URL in a new tab → response prefilled → edit → resubmit
   - Logged-in submit: revisit `/e/<eventId>` with the same account → auto-prefilled
7. In the Firestore Emulator UI (http://localhost:4000/firestore), confirm the `events/<eventId>/responses` subcollection

### Rules tests (optional)
```bash
firebase emulators:start --only firestore
pnpm --filter rules-tests test
```
Expected: PASS (events 7 + responses 7).

### Functions unit tests
```bash
pnpm --filter functions test
```
Covers token generation/verification, `deleteEvent`, and `updateEventSlots` (integration tests require the emulator).

## Manual verification — host result view (Plan 3)

1. Run through the Plan 2 flow above and collect a few participant responses
2. Sign in as host → Dashboard → click the event → `/events/:id/result`
3. Header:
   - Response count, slot count, status badge (Open / Closed)
   - "🔗 Copy share link" → copies `/e/:id` to the clipboard
   - "Close" → status flips to Closed → participants visiting `/e/:id` see a "closed event" screen
   - "Reopen" → restores Open state
4. Tabs:
   - **Availability matrix**: participants × slots with check marks; bottom row shows "available count / total responses"
   - **Auto-suggested assignments**: "Up to N / M participants matched" + combination cards (capped at 20, overflow shown as "top 20")
   - Unmatched participants are shown at the bottom of each combination card
5. Edge cases:
   - Zero responses: matrix shows "No responses yet", matching shows "Combinations will appear once responses come in..."
   - Everyone picks the same slot → multiple distinct assignment combinations

### Non-owner access check
Sign in with a different account and navigate directly to `/events/:other-user-event-id/result` → redirected to `/dashboard`. The Firestore responses subscription never starts (ownership confirmed before subscribing).

## Manual verification — hardening (Plan 4)

### Delete event flow
1. Host creates an event and collects 1–2 participant responses
2. Go to `/events/:id/result` → click "Delete event" in the header
3. In the confirmation dialog, click "Permanently delete" (Escape key or backdrop click also cancel)
4. You are redirected to `/dashboard`; the event no longer appears in the list
5. In the Firestore Emulator UI, confirm both `events/:id` and `events/:id/responses/*` are gone

### Edit event slots (Plan 5 — see below)
A dedicated edit page is available via the "Edit" button on the result view. (Details in the Plan 5 section.)

### First-visit hint
1. Clear localStorage: DevTools → Application → Local Storage → remove `meetplan:once:*` keys
2. Host event create page: the "Tip:" banner appears → disappears on X click or first cell click
3. Participant respond page: the "First time?" banner appears → same dismissal behavior
4. Reload the page — the banner should stay dismissed

## Manual verification — event editing (Plan 5)

### Edit slots
1. Host creates an event and collects 1–2 participant responses
2. On `/events/:id/result`, click "Edit" in the header (between "Copy share link" and "Close")
3. On the edit page (`/events/:id/edit`), verify:
   - Calendar: existing dates are highlighted in the accent color
   - Painter: existing slots are prefilled with the accent background
   - Time range (HH:mm–HH:mm): auto-detected from the earliest start and latest end of existing slots
   - If responses exist, an amber warning banner is shown:
     - "Only responses that had selected a time that was removed will have that selection cleared; other selections stay."
     - "The share link (`/e/...`) stays the same."
4. Add/remove dates, paint/unpaint slots
5. Click "Save" → redirected to `/events/:id/result`
6. On the result view matrix, verify:
   - Responses that had selected a removed slot: that check mark is cleared
   - Newly added slots: all empty (participants need to revisit to pick them)
7. In the Firestore Emulator UI, confirm `event.slots` is replaced and `responses.selectedSlotIds` are cleaned up

### Edge cases
- Remove all slots and try to save → "Save" button is disabled
- Concurrent participant submission during edit → Firestore transaction retries automatically; response consistency is preserved
- Another user navigates directly to `/events/:other-id/edit` → redirected to the dashboard

## Deployment (manual)

### One-time setup
1. In Firebase Console, create `meetplan-prod` (or your preferred name)
2. Enable Hosting, Firestore, Functions, Authentication
3. Authentication → Sign-in method → enable Google
4. Firestore → location `asia-northeast3`
5. Locally: `firebase login` → `firebase use --add` → select the project (alias `default`)
6. Add your deployed domain to the Authentication authorized domains list
7. Register a Web app and save its config into `apps/web/.env.production` (set `VITE_USE_EMULATOR=false` and fill the remaining keys)

### Deploy
```bash
pnpm deploy
```
Internally runs `web build → functions build → firebase deploy`, shipping Hosting, Firestore Rules, Indexes, and Functions together. To deploy only one area:
```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions
```

## v1 release checklist (manual)

Confirm the v1 scope is code-complete:

### Functionality
- [ ] Host Google sign-in / sign-out
- [ ] Dashboard empty state → "+ Create your first event"
- [ ] Event creation: title, period, multi-date selection, drag time painting
- [ ] Event creation mobile wizard (375px viewport)
- [ ] Share link copy → open `/e/:id` in an incognito browser
- [ ] Participant response: anonymous submit → token-save screen → revisit via token link → prefill → edit
- [ ] Participant response: Google-authed submit → revisit with same account → prefill
- [ ] Participant inline phone-format error
- [ ] Participant response mobile (375px)
- [ ] Host result view — availability matrix tab
- [ ] Host result view — auto-suggested assignments tab (top N, unmatched shown)
- [ ] Close / Reopen toggle
- [ ] Edit event slots (with warning banner and Firestore cleanup)
- [ ] Delete event (confirm dialog → dashboard redirect → Firestore cleanup)
- [ ] First-visit drag-paint hints (host + participant)

### Security
- [ ] Non-owner direct-navigating to `/events/:id/result` is redirected to the dashboard
- [ ] Participants cannot read another participant's response even by guessing the rid (Firestore rules)
- [ ] `getResponse` with a wrong token returns `permission-denied`
- [ ] Submitting to a closed event returns `event-closed`

### Data consistency
- [ ] Firestore Emulator UI: phone numbers are normalized (hyphens stripped)
- [ ] Firestore Emulator UI: `editTokenHash` is a hash, mutually exclusive with `ownerUid`
- [ ] After deleting an event, all responses are also gone

### Tests
- [ ] `pnpm test` — all unit tests pass
- [ ] `firebase emulators:start --only firestore && pnpm --filter rules-tests test` — rules tests pass

### Deployment
- [ ] `pnpm --filter web build` — bundle size acceptable (target ≤ 200 KB gzip)
- [ ] `pnpm --filter functions build` — `functions/lib/` produced
- [ ] `firebase emulators:start` loads the freshly built Functions
