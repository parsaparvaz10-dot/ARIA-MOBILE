# CLAUDE.md — Aria CRM Mobile App
# This is the source of truth for any Claude Code session in this repo.
# Last updated: 2026-03-30

---

## What This Is

Aria CRM is the mobile app for Aria Auto Sales — a CRM for car dealership salespeople.
Built by Parsa (CEO, ZAR Industries). First pilot: Christopher at Porsche River Oaks, Houston.
Christopher uses this app to see leads Aria captured, manage clients, view his calendar,
and read SMS conversations — all powered by the Aria backend on Fly.io.

---

## Architecture

```
Mobile App (Expo React Native, web-only target)
  ├── app/_layout.tsx — Root layout (fonts, providers, error boundary)
  ├── app/index.tsx — Auth/splash screen → auto-redirects to leads tab
  ├── app/(tabs)/ — 4 tabs:
  │     ├── leads.tsx — Lead cards with priority, conversation summary, call button
  │     ├── clients.tsx — Client cards with engagement level, vehicle info, call button
  │     ├── calendar.tsx — Week view calendar with appointment cards
  │     └── capture.tsx — SMS conversations (inbound/outbound threads)
  ├── context/AppContext.tsx — Global state, data fetching, normalization
  ├── lib/api.ts — All API calls to Fly.io backend
  └── components/ — Shared UI components

Backend API (NOT in this repo)
  → https://aria-auto-sales.fly.dev/api
  → Basic Auth: configured in api.ts
  → Separate repo: aria-auto-sales on Fly.io
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Expo SDK 54 + React Native 0.81 | Web-only target (platforms: ["web"]) |
| Router | expo-router 6 | File-based routing, typed routes |
| State | React Context (AppContext) | No Redux/Zustand — single context provider |
| Data fetching | Plain fetch via lib/api.ts | Auto-refreshes every 30 seconds |
| Icons | lucide-react-native | Consistent icon set |
| Fonts | Inter (400, 500, 600, 700) | Google Fonts via @expo-google-fonts |
| Notifications | expo-notifications | Wired but not registering tokens yet |
| Supabase client | @supabase/supabase-js | Imported but not actively used (API goes through Fly.io) |
| Hosting | Replit | Runs as web app via expo start --web |

---

## Project Structure — Files That Matter

### Core (the app logic)
| File | What it does |
|------|-------------|
| `context/AppContext.tsx` | THE brain of the app. Lead/Client/Appointment interfaces, normalizeLead/normalizeClient mappers, loadData (fetches all 4 endpoints in parallel), 30-second auto-refresh. |
| `lib/api.ts` | Every API call. Base URL defaults to `https://aria-auto-sales.fly.dev/api`. All CRUD for leads, clients, appointments, conversations, call proxy. |

### Tabs (the 4 screens)
| File | What it does |
|------|-------------|
| `app/(tabs)/leads.tsx` | Lead list with priority badges (HOT/WARM/TODAY), search, add lead sheet, detail modal with conversation summary, notes, budget, email, call history. |
| `app/(tabs)/clients.tsx` | Client list with engagement levels, lease expiry insights, search, add client sheet, detail modal with vehicle info, conversation summary, notes, call history. |
| `app/(tabs)/calendar.tsx` | Week-view calendar with appointment cards, time slots, add appointment sheet with type picker and time selection. |
| `app/(tabs)/capture.tsx` | SMS conversations list, message thread view, send message. Currently labeled "Messages" in tab bar. |

### Components (shared UI)
| File | What it does |
|------|-------------|
| `components/Header.tsx` | App header with "Aria CRM" title |
| `components/CallHistory.tsx` | Shows call history for a contact (matched by phone number) |
| `components/FormField.tsx` | Reusable labeled text input |
| `components/SlideSheet.tsx` | Bottom sheet for forms (add lead, add client, etc.) |
| `components/PressableScale.tsx` | Animated press button |
| `components/StatusPicker.tsx` | Lead stage picker (New → Contacted → Appt Set → Negotiating → Closed) |
| `components/CallConfirmModal.tsx` | Confirmation modal before placing a call |
| `components/GlobalSearch.tsx` | Cross-tab search |
| `components/Avatar.tsx` | Initials avatar |
| `components/ErrorBoundary.tsx` | Catches React errors |
| `components/ErrorFallback.tsx` | Error fallback UI |

### Utils & Config
| File | What it does |
|------|-------------|
| `constants/colors.ts` | Color palette. Primary: `#a855f7` (purple). Gold accent: `#C8A951`. Dark background: `#09090b`. |
| `utils/phone.ts` | Phone formatting + `initiateCall()` (opens tel: link) |
| `utils/time.ts` | `relativeTime()` and `formatTime()` helpers |
| `lib/supabase.ts` | Supabase client init. Currently unused — all data goes through Fly.io API. |
| `hooks/useNotifications.ts` | Expo push notification setup. Registers handler but token registration not working yet. |

### Infrastructure
| File | What it does |
|------|-------------|
| `app.json` | Expo config. App name "Aria CRM", dark mode only, web platform only. |
| `package.json` | Dependencies. Expo 54, React Native 0.81, lucide icons, supabase client. |
| `babel.config.js` | Babel config with React compiler plugin |
| `tsconfig.json` | TypeScript config with path aliases (@/) |
| `scripts/build.js` | Expo web build script |
| `server/serve.js` | Static file server for built web app |
| `metro.config.js` | Metro bundler config |

---

## Data Model

### Lead (from AppContext.tsx)
| Field | Type | Source |
|-------|------|--------|
| id | string | `leads.id` |
| name | string | `leads.caller_name` (falls back to phone) |
| phone | string | `leads.phone` |
| email | string? | `leads.email` |
| vehicle | string | `leads.vehicle_interest` |
| stage | Stage | Derived from `status` or `next_action` |
| notes | string | `leads.notes` |
| budget | string? | `leads.budget` |
| timeline | string? | `leads.timeline` |
| lastConversationSummary | string? | `leads.last_conversation_summary` |
| createdAt | number | `leads.created_at` as epoch ms |

### Client (from AppContext.tsx)
| Field | Type | Source |
|-------|------|--------|
| id | string | `clients.id` (UUID) |
| name | string | `clients.name` |
| phone | string | `clients.phone` |
| email | string? | `clients.email` |
| vehicle | string | `clients.vehicle_purchased` |
| vehicleInterest | string? | `clients.vehicle_interest` |
| notes | string | `clients.notes` |
| lastConversationSummary | string? | `clients.last_conversation_summary` |
| purchaseDate | string | `clients.purchase_date` formatted |
| leaseExpiry | string? | `clients.lease_expiry` formatted |
| tags | string[] | `clients.tags` (JSONB) |

### Stage Pipeline
`New` → `Contacted` → `Appt Set` → `Negotiating` → `Closed`

---

## API Endpoints Used (Fly.io Backend)

**Base URL:** `https://aria-auto-sales.fly.dev/api`

| Method | Endpoint | Used in |
|--------|----------|---------|
| GET | /leads | loadData (AppContext) |
| PATCH | /leads/{id}/status | updateLeadStage |
| PATCH | /leads/{id}/notes | updateLeadNotes |
| DELETE | /leads/{id} | deleteLead |
| GET | /clients | loadData (AppContext) |
| PATCH | /clients/{id} | updateClient |
| POST | /clients | createClient |
| DELETE | /clients/{id} | deleteClient |
| GET | /appointments | loadData (AppContext) |
| POST | /appointments | createAppointment |
| DELETE | /appointments/{id} | deleteAppointment |
| GET | /calls | loadData (AppContext) |
| GET | /calls/{id} | getCall |
| GET | /conversations | capture.tsx (Messages tab) |
| GET | /conversations/{phone} | Message thread view |
| POST | /call/proxy | connectCall |

---

## Key Patterns

### Auto-Refresh
AppContext polls all 4 endpoints every 30 seconds. Pull-to-refresh is also available on every tab.

### Optimistic Updates
Add/delete operations update local state immediately, then sync to API. If API fails, state reverts via loadData().

### Caller Recognition Display
- Cards show the last caller message from `lastConversationSummary` as a preview
- Detail modals show the full conversation transcript color-coded (Aria vs Caller)
- Falls back to `notes` if no conversation summary exists

### Phone Number Matching
CallHistory component matches calls by normalizing phone numbers (strip non-digits) and comparing suffixes.

### Lead Priority System
Based on time since creation:
- JUST NOW (≤1hr) — red
- HOT (≤6hr) — orange
- WARM (≤12hr) — amber
- TODAY (≤24hr) — blue
- YESTERDAY (≤48hr) — purple
- Xd AGO — gray

### Client Engagement Levels
Based on call count:
- VERY ENGAGED (≥5 calls) — green
- ENGAGED (≥3 calls) — blue
- ACTIVE (≥1 call) — amber
- NEW (0 calls) — gray

---

## Current State (2026-03-30)

### Live and Working
- 4-tab layout (Leads, Clients, Calendar, Messages)
- Lead cards with priority, vehicle interest, phone, conversation preview
- Client cards with engagement level, vehicle, conversation preview
- Detail modals with full conversation transcripts (color-coded Aria/Caller)
- Budget, email, vehicle interest displayed on lead detail
- Vehicle interest (from Aria calls) displayed on client detail
- Calendar with week view and appointment management
- SMS conversations view
- Call button on every card (tel: link)
- Add lead/client/appointment forms
- Long-press context menus
- Pull-to-refresh + 30-second auto-refresh
- Client insights (lease expiring, no recent contact)
- Mark lead as client (converts with data)
- Editable notes on both leads and clients
- Call history per contact
- Search on leads and clients tabs
- Error boundary with fallback UI

### Not Working / Pending
- Push notifications: hook exists, token registration not working
- Auth: hardcoded to Christopher (DEFAULT_USER), no real login
- Supabase client imported but not used (all API through Fly.io)
- SMS send from app: UI exists but depends on A2P 10DLC approval
- Not backed up to Git (only on Replit + this local copy)
- Web-only target — no native iOS/Android builds yet

---

## Design System

### Colors
- **Background:** `#09090b` (near-black)
- **Cards:** `#161618` (dark gray)
- **Primary:** `#a855f7` (purple) — Aria's color, used for lead detail accents
- **Gold:** `#C8A951` — Christopher's color, used for phone numbers, call buttons, client accents
- **Text:** `#fafafa` (white), `#888` (muted), `#555` (very muted)

### Typography
- Inter font family (400, 500, 600, 700)
- Card titles: 16px semibold white
- Subtitles: 13px regular #888
- Phone numbers: 14px medium #C8A951
- Labels: 12px bold #888 with letter-spacing

---

## Key Numbers

| What | Value |
|------|-------|
| Pilot salesperson | Christopher at Porsche River Oaks |
| Chris UUID | 00000000-0000-0000-0000-000000000001 |
| Backend URL | https://aria-auto-sales.fly.dev/api |
| Replit origin | https://replit.com/ |
| App name | Aria CRM |

---

## Known Technical Debt

1. No real auth — hardcoded to Christopher's UUID
2. Supabase client is imported but unused (vestigial from earlier architecture)
3. Web-only target — no native builds configured
4. Not backed up to Git — critical risk if Replit goes down
5. Pre-existing TypeScript errors in _layout.tsx, hooks, and lib files (strict mode issues)
6. No tests
7. No CI/CD
8. Call proxy goes through Fly.io API, not direct Twilio — adds latency

---

## Session Rules

### 9-Step Pipeline (follow for EVERY task, no exceptions)

1. **Understand** — Read the relevant files before doing anything
2. **Test first** — Write 7 test cases, show me, HARD STOP. Do NOT write any code until I approve the tests.
3. **Implement** — Write the code
4. **Self-audit** — List the 3 most likely failure modes, edge cases, and data risks. Fix any issues immediately.
5. **Test** — Run the relevant test suite. If tests fail, go back to step 3.
6. **Pre-deploy** — State what changes and what shouldn't
7. **Deploy** — Push to Replit or build
8. **Post-deploy verify** — Check the app loads correctly and new features work
9. **Report** — Tell me what changed, what to update in CLAUDE.md and Obsidian, and the new version number.

Step 2 is a hard gate. No approval from me, no code gets written. This applies to features, fixes, refactors, and behavior changes. No exceptions.

### Constraints
- Do NOT refactor working code unless explicitly asked
- Do NOT add features that aren't in the current task
- AppContext.tsx is the most important file — changes here affect every screen
- Keep the data model in sync with the backend schema (see aria-auto-sales CLAUDE.md)
- Don't break the 30-second auto-refresh cycle
- Don't change the color palette without approval
- The app is web-only — don't add native-only APIs
