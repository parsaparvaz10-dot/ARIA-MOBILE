# Aria Mobile — CLAUDE.md

> Claude Code reads this file automatically at session start.
> This is the single source of technical truth for the ARIA-MOBILE codebase.
> Last updated: 2026-03-30

---

## What This Is

Expo React Native CRM companion app for **Aria Auto Sales**. Pilot user: Christopher Mazloomi, salesperson at Porsche River Oaks, Houston.

Christopher uses this app daily to see his leads, clients, call history, and appointments — all captured automatically by the Aria AI voice agent on the backend. He can call or text customers directly from the app.

**This is a live production app.** Christopher is actively using it. Every change you make affects a real user.

---

## Stack

| Component | Choice |
|-----------|--------|
| Framework | Expo SDK 54, React Native 0.81.5 |
| Language | TypeScript |
| Data fetching | TanStack Query (React Query) |
| Animations | Reanimated |
| Routing | expo-router (file-based) |
| Push notifications | expo-notifications |
| Backend | Fly.io (aria-auto-sales.fly.dev) — NOT in this repo |
| Database | Supabase PostgreSQL — accessed via Fly.io API, NOT directly |

---

## Architecture

```
app/                    # expo-router file-based routing
  (tabs)/               # Tab navigator screens
    leads.tsx           # Leads list + detail
    clients.tsx         # Clients list + detail
    calls.tsx           # Call history
    calendar.tsx        # Appointments
    activity.tsx        # Activity feed
components/             # Reusable UI components
context/
  AppContext.tsx         # Global app state
hooks/
  useNotifications.ts   # Push notification registration
lib/
  api.ts                # ALL backend API calls (HIGH PRIORITY FILE)
assets/                 # Images, fonts
```

---

## Key Files (Priority Order)

| File | Priority | What It Does |
|------|----------|-------------|
| `lib/api.ts` | HIGH | Every backend API call. Auth header lives here. If data isn't loading, start here. |
| `hooks/useNotifications.ts` | HIGH | Push token registration. Has its OWN auth header (separate from api.ts). |
| `context/AppContext.tsx` | MEDIUM | Global state, salesperson ID, refresh triggers |
| `app.json` | MEDIUM | Expo config, push notification setup, app identity |
| `app/(tabs)/*.tsx` | MEDIUM | Individual screen files — UI and data display |

---

## Auth — CRITICAL

**Auth method:** Basic Auth (NOT Supabase Auth, NOT JWT, NOT OAuth)

**Credentials:**
- Username: `chris.mazloomi`
- Password: (rotated 2026-03-31)
- Pre-computed base64: `Y2hyaXMubWF6bG9vbWk6dlY0S1VFMjRQRnlRQV5hT3hedG5vREd1QnNBNA==`

**Auth lives in TWO independent places:**
1. `lib/api.ts` — for all CRM data calls
2. `hooks/useNotifications.ts` — for push token registration

**HARD RULES:**
- NEVER use `getAuthHeader()` or `supabase.auth.getSession()` — these hang forever in React Native
- NEVER use `btoa()` — it may not exist in React Native runtime
- ALWAYS use the pre-computed base64 string directly: `'Authorization': 'Basic Y2hyaXMubWF6bG9vbWk6dlY0S1VFMjRQRnlRQV5hT3hedG5vREd1QnNBNA=='`
- ALWAYS use `.then()/.catch()` chains, NOT async/await (more reliable in this environment)

**Before ANY change, run:** `grep -rn "Authorization\|Basic\|auth\|getAuth\|getSession" lib/ hooks/ --include="*.ts" --include="*.tsx"` to confirm you know where every auth reference is.

---

## API Endpoints (consumed from Fly.io backend)

**Base URL:** `https://aria-auto-sales.fly.dev`

| Method | Endpoint | Used By |
|--------|----------|---------|
| GET | /api/leads | Leads tab |
| GET | /api/leads/{id} | Lead detail |
| PUT | /api/leads/{id} | Edit lead |
| PUT | /api/leads/{id}/status | Convert to client |
| GET | /api/clients | Clients tab |
| PUT | /api/clients/{id} | Edit client |
| GET | /api/calls | Calls tab |
| GET | /api/appointments | Calendar tab |
| POST | /api/appointments | Create appointment |
| POST | /api/call/proxy | Call button (Twilio) |
| POST | /api/sms/send | Text button |
| GET | /api/conversations | Messages tab |
| POST | /api/push-token | Push token registration |

---

## 9-Step Pipeline

Every task follows this sequence. No exceptions.

1. **Understand** — Read the relevant files in THIS repo
2. **Test first** — Write 5-7 test cases, show Parsa, HARD STOP until approved
3. **Implement** — Write the code
4. **Self-audit** — List 3 most likely failure modes
5. **Test** — Verify the change works
6. **Pre-deploy** — git status, confirm what changed
7. **Deploy** — git commit → git push (Parsa pulls in Replit)
8. **Post-deploy verify** — Parsa confirms in Expo Go
9. **Report** — Update CLAUDE.md + remind Parsa to update Obsidian

**Step 2 is a hard gate.** No approval from Parsa, no code gets written.

---

## Deploy Workflow

```
1. Make changes locally (~/Downloads/app/artifacts/mobile/)
2. git add -A && git commit -m "descriptive message"
3. git push origin main
4. Tell Parsa: "Push is ready. In Replit shell run: git pull && npx expo start --tunnel"
5. Parsa opens Expo Go on iPhone, scans QR code
6. Verify the change works on the physical device
```

**NEVER run `fly deploy` from this repo.** That's the backend repo. This repo deploys via git + Replit.

---

## Session Rules

1. Do NOT refactor working code unless explicitly asked
2. Do NOT add features that aren't in the current task
3. Before ANY change, grep all auth locations (command above)
4. After writing code, self-audit: list the 3 most likely failure modes
5. Keep deploys atomic — one feature per deploy, verify before the next
6. Use ONLY React Native components (View, Text, TouchableOpacity, ScrollView, FlatList, StyleSheet). NEVER use HTML elements or CSS classes.
7. NEVER use `getAuthHeader()`, `supabase.auth.getSession()`, or `btoa()`
8. NEVER run `fly deploy` — that's the wrong repo
9. Always use absolute file paths when editing (e.g., `lib/api.ts` not just `api.ts`)

---

## Key Constraints (every task, no exceptions)

- Never touch `lib/api.ts` auth without also checking `hooks/useNotifications.ts` auth, and vice versa
- Auth is never isolated to one file — when fixing auth on ANY endpoint, grep ALL fetch calls in the codebase
- Step 2 is a hard gate — no code without Parsa's approval on tests
- One feature per deploy (atomic)
- The mobile app deploys through Replit, NOT Fly.io — never run `fly deploy` from this repo
- No `btoa()` on physical devices — use pre-computed base64 string
- No `getAuthHeader()` or `supabase.auth.getSession()` — they hang forever
- Use `.then()/.catch()` chains, NOT async/await
- Push tokens only work on physical devices, not simulators
- Tunnel mode required on Replit (`npx expo start --tunnel`) — standard Expo Go won't work
- Do NOT refactor working code unless Parsa explicitly asks
- Do NOT add features beyond the stated task
- Use absolute paths when the working directory resets between commands

---

## Expo / React Native Constraints

- No `<form>` tags — use View + TextInput + TouchableOpacity
- No `localStorage` — use AsyncStorage or React state
- No `btoa()` — use pre-computed base64 string
- Push notifications only work on physical devices, not simulators
- Tunnel mode required: `npx expo start --tunnel`
- Expo Go on iOS works for pilot. Android requires dev build (not needed now).

---

## Common Issues & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| All tabs empty, no data | 401 on all API calls | Check auth header in `lib/api.ts` |
| Push not arriving | Token not registered | Check `fly logs -a aria-auto-sales` for `[DB] Push token saved`. If missing, check auth in `useNotifications.ts` |
| `npm install` fails with "Cannot read properties of null" | Corrupted node_modules or lock file | `rm -rf node_modules package-lock.json .expo` then `npm install --legacy-peer-deps` |
| QR code gives 502 | Replit proxy broken | Kill Metro, restart with `npx expo start --tunnel` |
| JSON parse error after editing app.json | Missing comma | Check the line ABOVE the error — add comma |
| Branch not tracking remote | Git setup issue | `git branch --set-upstream-to=origin/main main` |
| Divergent branches on git pull | Replit edits conflict with local | `git reset --hard origin/main` (local is source of truth) |
| Android push notifications don't work | Expo Go SDK 53+ dropped Android push | Use iOS for pilot. Android requires dev build. |
| App works on web but not phone | app.json platforms missing | Ensure `"platforms": ["ios", "android", "web"]` |

---

## Repos & Infrastructure

| What | Where |
|------|-------|
| This repo (mobile) | `~/Downloads/app/artifacts/mobile/` (local) |
| GitHub | github.com/parsaparvaz10-dot/ARIA-MOBILE |
| Replit | Hosts Expo dev server |
| Backend repo | `~/Downloads/ZAR AGENTS/aria-auto-sales/` (separate repo, separate CLAUDE.md) |
| Backend API | https://aria-auto-sales.fly.dev |
| Expo account | @prsa.parvaz |

---

## Key Numbers

| What | Value |
|------|-------|
| Backend URL | https://aria-auto-sales.fly.dev |
| Chris UUID | 00000000-0000-0000-0000-000000000001 |
| Twilio number | +1 (346) 644-8190 |
| Chris cell | +1 (713) 291-0059 |
| Parsa test | +1 (832) 528-9457 |

---

## Known Technical Debt

1. Hardcoded credentials — rotate before expanding beyond Christopher
2. No automated tests — manual verification only
3. No CI/CD — deploy is manual git push
4. Free tier Expo — sufficient for pilot
5. Android push requires dev build (iOS Expo Go works for pilot)

---

## Lessons Learned

1. **`getAuthHeader()` is the #1 app killer.** It calls `supabase.auth.getSession()` which hangs forever. This has caused three separate freezes. Always use inline Basic Auth with the pre-computed base64 string.
2. **Auth lives in two places.** Fixing api.ts but not useNotifications.ts (or vice versa) breaks half the app. Always grep both.
3. **Replit Agent breaks React Native.** If given open-ended prompts, it introduces HTML/CSS. Every Replit prompt must explicitly say "React Native only — View, Text, TouchableOpacity, StyleSheet."
4. **Backend bugs look like mobile bugs.** When data doesn't show up, check the backend API with curl BEFORE touching the mobile code.
5. **`btoa()` doesn't exist in React Native.** Use the pre-computed base64 string: `Y2hyaXMubWF6bG9vbWk6dlY0S1VFMjRQRnlRQV5hT3hedG5vREd1QnNBNA==`
