# CLAUDE.md — Aria Mobile App

> Claude Code reads this file automatically at session start.
> This is the single source of technical truth for the ARIA-MOBILE codebase.
> Last updated: 2026-03-30

---

## What This Is

Aria Mobile is the CRM companion app for Aria Auto Sales — an AI voice agent for car dealership salespeople. This app is how the salesperson (Christopher at Porsche River Oaks) sees leads, call transcripts, conversation summaries, and calls people back. It is NOT the voice agent — that lives in the backend repo (aria-auto-sales on Fly.io).

**The app's job:** Chris misses a call → Aria captures the lead → push notification buzzes Chris's phone → Chris opens the app → sees who called and what they want → taps Call to follow up.

**Pilot user:** Christopher Mazloomi, Porsche River Oaks, Houston TX.

---

## Stack

- **Framework:** Expo SDK 54, React Native 0.81.5
- **Navigation:** expo-router (file-based routing)
- **Language:** TypeScript
- **Data fetching:** TanStack React Query
- **Animations:** React Native Reanimated
- **Push notifications:** expo-notifications
- **Backend:** Fly.io (aria-auto-sales.fly.dev) — Python/FastAPI
- **Database:** Supabase PostgreSQL (accessed through Fly.io API, not directly)
- **Deploy:** Replit (git push → git pull in Replit shell → npx expo start --tunnel)

---

## Architecture

```
Mobile App (this repo)
  ├── app/              → Expo Router pages (file-based routing)
  ├── components/       → Reusable UI components
  ├── context/
  │   └── AppContext.tsx → Global state, consumes lib/api.ts
  ├── hooks/
  │   └── useNotifications.ts → Push token registration + notification handlers
  ├── lib/
  │   ├── api.ts        → ALL API calls to Fly.io backend (apiFetch with Basic Auth)
  │   └── supabase.ts   → Supabase client config
  ├── assets/           → Images, icons, fonts
  └── app.json          → Expo config (platforms, projectId, notification settings)

Backend (separate repo: aria-auto-sales on Fly.io)
  └── All data comes from here via REST API
```

---

## Key Files (Know These)

| File | What It Does | Risk Level |
|------|-------------|------------|
| `lib/api.ts` | **THE** API layer. ALL data endpoints (leads, clients, calls, appointments, conversations) go through `apiFetch()`. Has the Basic Auth header. If tabs are empty, check here first. | HIGH |
| `hooks/useNotifications.ts` | Push token registration + notification tap routing. Has its OWN separate auth header (not shared with api.ts). | HIGH |
| `context/AppContext.tsx` | Global state provider. Consumes `api` from `lib/api.ts`. Defines Lead, Client, Appointment types. | MEDIUM |
| `app.json` | Expo config. Platforms (ios, android, web), projectId for push tokens, notification icon/color. | MEDIUM |
| `app/` directory | All screens/pages via expo-router. File = route. | MEDIUM |

---

## Auth

- **Type:** Basic Auth
- **Credentials:** `john.martinez` / `PorscheRO-2026!xK9m`
- **Where it's set:** Two separate places:
  1. `lib/api.ts` → Authorization header in `apiFetch()` → used by ALL data endpoints
  2. `hooks/useNotifications.ts` → Authorization header in push token POST → used ONLY for token registration
- **CRITICAL:** These are INDEPENDENT. Fixing auth in one does NOT fix the other.
- **How to find all auth:** `grep -r "Authorization\|AUTH_USER\|AUTH_PASS\|btoa\|Basic " --include="*.ts" --include="*.tsx" -l . | grep -v node_modules`

---

## API Endpoints (Backend on Fly.io)

**Base URL:** `https://aria-auto-sales.fly.dev/api`
**All endpoints require Basic Auth.**

| Used In App | Endpoint | Purpose |
|-------------|----------|---------|
| Leads tab | GET /leads | All leads with conversation summaries |
| Leads tab | PATCH /leads/{id}/status | Update lead stage |
| Leads tab | PATCH /leads/{id}/notes | Update lead notes |
| Leads tab | DELETE /leads/{id} | Delete lead |
| Clients tab | GET /clients | All clients |
| Clients tab | PATCH /clients/{id} | Update client |
| Calendar tab | GET /appointments | All appointments |
| Activity tab | GET /calls | All calls with transcripts |
| Conversations | GET /conversations | SMS thread list |
| Conversations | GET /conversations/{phone} | SMS thread by phone |
| Call button | POST /call/proxy | Initiate call via Twilio |
| Text button | POST /sms/send | Send SMS via Twilio |
| Push setup | POST /push-token | Register Expo push token |

---

## 9-Step Pipeline (Enforced — Same as Backend)

Every task follows this sequence. No exceptions.

1. **Understand** — read the relevant files
2. **Test first** — write 7 test cases, show Parsa, HARD STOP until approved
3. **Implement** — write the code
4. **Self-audit** — failure modes, edge cases, data risk
5. **Test** — run tests. Fail = go back to step 3
6. **Pre-deploy** — note what changes, what shouldn't break
7. **Deploy** — git add, commit, push. Then git pull in Replit.
8. **Post-deploy verify** — open Expo Go on phone, verify the change works
9. **Report** — update CLAUDE.md + tell Parsa what to update in Obsidian

**Step 2 is a hard gate.** No approval from Parsa, no code gets written.

---

## Deploy Workflow

```
1. Edit locally:  ~/Downloads/app/artifacts/mobile/
2. Push:          cd /Users/parsaparvaz/Downloads/app/artifacts/mobile && git add . && git commit -m "description" && git push
3. In Replit:     git pull origin main
4. If new deps:   npm install --legacy-peer-deps
5. Start:         npx expo start --tunnel
6. Test:          Scan QR with Expo Go on physical iPhone
```

**Standard Expo Go will NOT work on Replit** — must use tunnel mode.

---

## Session Rules

1. Do NOT refactor working code unless Parsa explicitly asks
2. Do NOT add features beyond the stated task
3. When fixing auth on ANY endpoint, grep ALL fetch calls in the codebase — auth is never isolated to one file
4. After writing code, self-audit: list the 3 most likely failure modes
5. One feature per deploy, verify before moving to next
6. Never touch `lib/api.ts` auth without also checking `hooks/useNotifications.ts` auth, and vice versa
7. The mobile app deploys through Replit, NOT through Fly.io. Don't run `fly deploy` from this repo.
8. Step 2 of the pipeline is a hard gate — write tests, show Parsa, STOP until approved.
9. Use absolute paths when the working directory resets between commands.

---

## Expo / React Native Constraints

- No `<form>` tags — use `onPress` / `onChange` handlers
- No `localStorage` or `sessionStorage` — use React state or AsyncStorage
- No `btoa()` on physical devices — hardcode Base64 strings or use a polyfill
- Push tokens only work on physical devices, not simulators
- Tunnel mode required on Replit (`npx expo start --tunnel`)
- iOS push works in Expo Go. Android push requires development build (SDK 53+).

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

| Component | Location | Deploy |
|-----------|----------|--------|
| This app (mobile) | `~/Downloads/app/artifacts/mobile/` | git push → git pull in Replit → `npx expo start --tunnel` |
| Backend (voice + API) | `~/Downloads/ZAR AGENTS/aria-auto-sales/` | `fly deploy` |
| GitHub | github.com/parsaparvaz10-dot/ARIA-MOBILE | Private |
| Replit | Connected via git | Auto-serves via Expo |
| Expo account | @prsa.parvaz | Project: aria-mobile |

---

## Key Numbers

| What | Value |
|------|-------|
| Backend URL | https://aria-auto-sales.fly.dev |
| Pilot salesperson | Christopher at Porsche River Oaks |
| Chris UUID | 00000000-0000-0000-0000-000000000001 |
| Twilio number | +1 (346) 644-8190 |
| Chris cell | +1 (713) 291-0059 |
| Parsa test | +1 (832) 528-9457 |

---

## Known Technical Debt

1. Credentials hardcoded in `lib/api.ts` and `hooks/useNotifications.ts` — move to env/config before expanding beyond Chris
2. No automated tests for the mobile app
3. No CI/CD — manual git push/pull workflow
4. Free tier Expo — may need upgrade for production push volume
5. Android requires dev build for push — iOS only for pilot

---

## Lessons Learned (do not remove)

- Auth is never isolated to one file. When fixing auth on any endpoint, grep the entire codebase for ALL fetch calls.
- If ALL data endpoints return 401 but push-token returns 200, the problem is in `lib/api.ts`, not the backend.
- When a bug "should be fixed" but isn't, check whether Claude Code actually edited the right file.
- The backend CLAUDE.md exists at `~/Downloads/ZAR AGENTS/aria-auto-sales/CLAUDE.md` — don't duplicate backend info here.
- `salesperson_knowledge.md` on the backend can contain banned phrases that leak into voice responses — if voice quality degrades, search the knowledge base too.
