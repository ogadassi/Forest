# Dashboard Widget Refinement — Work Structure

## Overview

The dashboard has **5 note content types** that live inside **category panel widgets** which are
arranged on a **responsive grid**. Work is grouped by widget type so each session has a clear
scope and a done state.

---

## Widget Map

| # | Widget / Content Type | Key files |
|---|---|---|
| 1 | **Text note** (default) | `NoteCard.tsx`, `EditNoteModal.tsx`, `CreateNoteModal.tsx` |
| 2 | **Checklist note** | `NoteCard.tsx` (checklist branch), `EditNoteModal.tsx` |
| 3 | **Timer note** | `TimerNote.tsx`, `NoteCard.tsx` (timer branch) |
| 4 | **Song note** | `SongNoteContent.tsx`, `NoteCard.tsx` (song branch), `EditNoteModal.tsx`, `CreateNoteModal.tsx` |
| 5 | **Demo note** | `DemoNoteContent.tsx`, `NoteCard.tsx` (demo branch), `EditNoteModal.tsx`, `CreateNoteModal.tsx` |
| 6 | **Category panel** (container) | `CategoryPanel/index.tsx`, `CategoryHeader.tsx`, `CategoryGrid.tsx`, `ChecklistList.tsx` |
| 7 | **Dashboard grid** (outer shell) | `BoardView.tsx`, `CategoryGrid.tsx`, snap logic |
| 8 | **Visual polish** (all elements) | All of the above — layout elegance, spacing, animation, consistency |

---

## Phase 1 — Text Note Widget ✅
*Scope: the plain rich-text note card and its modals.*

**Modals — create & edit**
- [x] `EditNoteModal` — `isSubmitting` spinner fixed; hardcoded `maxHeight` removed
- [x] `CreateNoteModal` — CREATE NOTE button added; `categoryType` dep array fixed
- [x] Image handling — inserts at editor width, bullet-list-on-image bug fixed, options toolbar no longer clips, title insertion guard added
- [x] Editor content width — removed `max-w-2xl mx-auto` constraint; editor now fills the full modal width
- [x] Title/content separator — gradient-fade divider in both modals; tinted with note colour
- [x] Modal colour intensity — background gradient matches card richness; border and box-shadow tinted with note colour
- [x] Placeholder colour — title placeholder changed from `slate-600` to `white/30` (works on any background colour)
- [x] Save button — `handleSubmit` had a silent early-return guard that blocked saving; fixed in both modals; colour-change-only saves now work in edit mode
- [x] Save guard consistency — `disabled` prop and `handleSubmit` guard now kept in sync; create explicitly checks for formatting changes (e.g. adding a bullet point) to allow saves even if text is empty.

**Note card (dashboard view)**
- [x] Title/content separator — gradient-fade divider on card; tinted with note colour
- [x] Card colour intensity — card background confirmed richer than modal (source of truth)
- [x] Drag handle isolation — handle no longer visibly triggers when hovering the entire card, now relies on a localized corner-hover `group/drag` configuration for cleaner view.
- [x] Delete feedback — added spinning state replacing the trash icon while awaiting API deletion for snappier UI response.
- [x] No-title cards — title block + divider hidden when `note.title` is empty; content shifts up
- [x] Empty cards — notes with no title and no content show an "Empty note" ghost label so they're always findable and clickable

**Backend**
- [x] Zod schema — `title: z.string().min(1)` changed to `z.string()` in both insert and update schemas; empty-string titles are now valid, silently rejected notes are fixed

**Confirmed fine (no fix needed)**
- [x] Card preview — images clipped by `overflow-hidden` + fade mask; acceptable
- [x] RTL detection — strips HTML before checking; accurate for current use case

---

## Phase 2 — Checklist Note Widget
*Scope: the checklist-specific rendering inside a card and the editor.*

- [ ] Card preview: checked/unchecked state rendering, bullet style
- [ ] Inline toggle persists to DB (optimistic update chain)
- [ ] `EditNoteModal` checklist tab: add / remove / reorder items
- [ ] `CreateNoteModal` checklist creation UX
- [ ] **Periodic reset** — gear icon in the category widget top bar and in creation flow; settings: reset period (daily / weekly / monthly / custom), which items to reset (all unchecked vs. all vs. user-picked set), and trigger mode (automatic at period start OR prompted on first open after period passes)

---

## Phase 3 — Timer Note Widget
*Scope: the full-card timer display (enhance existing timer note type).*

- [ ] Timer card sizing (min/max in grid)
- [ ] Start / stop / reset controls
- [ ] Color tinting interaction with timer UI
- [ ] Edge cases: elapsed persistence, countdown vs stopwatch
- [ ] **Enhance existing timer** — add Pomodoro mode (configurable work/break intervals), stopwatch mode (count-up), and a history panel showing past sessions inside the note

---

## Phase 4 — Song Note Widget
*Scope: multi-section lyric editor and card preview.*

- [ ] Card preview: section labels, lyric truncation
- [ ] `SongNoteContent` — immersive lyric editor UX
- [ ] Section management (add, remove, reorder, rename, vocalist colour)
- [ ] **Per-line / per-word vocalist colouring** — each line or word can be tagged to a vocalist; each vocalist gets a colour; the colouring is visible in both the editor and the card preview
- [ ] `EditNoteModal` song tab: save / discard
- [ ] `CreateNoteModal` song creation flow

---

## Phase 5 — Demo Note Widget
*Scope: audio attachment note. Visually identical to Song note.*

- [ ] Card preview: waveform / attachment indicator
- [ ] `DemoNoteContent` — playback UX
- [ ] **Voice recording pin** — user can attach a voice recording and pin it to a specific line or word; pinned recordings appear as a static mic icon next to that line/word that plays on tap
- [ ] `EditNoteModal` demo tab: replace / remove audio
- [ ] `CreateNoteModal` demo creation flow

---

## Phase 6 — Category Panel (container widget)
*Scope: the panels themselves, independent of note type.*

- [ ] `CategoryHeader`: rename, icon picker, colour picker, delete
- [ ] Panel scroll behaviour, empty state
- [/] `ChecklistList`: category-level checklist widget — mostly done; **corner snap + horizontal snap still missing**
- [ ] Note ordering / drag-to-reorder within a panel
- [ ] "Add note" button placement and modal hand-off
- [ ] Fullscreen (single-category) vs grid view transitions
- [ ] **Dual-layout swap** — when entering / exiting fullscreen, switch the active note layout from `dashboardLayout` to `fullscreenLayout` (requires Phase 7 schema first)

> [!IMPORTANT]
> Implement the Phase 7 schema change **before** the dual-layout swap item — the panel needs two layout maps to exist before it can swap between them.

### Content-Fit Snap + Vertical Centering (all widget types)

**Philosophy** (already applied to checklist, needs applying everywhere else):
- **Auto-fit snap**: double-clicking a resize handle snaps the panel/card to the minimum grid size that fits all content without scrolling and without cutting anything off.
- **Vertical centering**: content is vertically centered (`my-auto` inside a `flex flex-col` parent) so any leftover space from grid quantization is split equally top and bottom — no "chin".
- Both together ensure every widget looks intentional at every grid size.

#### Grid math (how pixels become grid units)

```
rowHeight = 34px   rowGap = 14px
h_units = ceil( (pixelHeight + rowGap) / (rowHeight + rowGap) )
        = ceil( (pixelHeight + 14) / 48 )

// NOTE: BoardView.tsx currently divides by 34 instead of 48 — this is a bug
// that makes panels snap too tall. Must fix alongside the formula work below.
```

#### Status table

| Widget | Snap formula | Vertical centering | Status |
|---|---|---|---|
| **Checklist panel** | `header.offsetHeight + items.scrollHeight + addBar.offsetHeight + 14` | `my-auto` on `checklistItemsRef` div | ✅ *corner + horizontal snap still missing* |
| **Timer panel** | ❌ broken — branches into the checklist path, reads `checklistItemsRef` (null for timers) → measures 0 | ✅ `flex items-center justify-center` already | ❌ |
| **Note-grid panel** | partially works — `header.offsetHeight + notesGrid.offsetHeight + 24` — but `notes-grid-container` selector may not match actual DOM class | ❌ `CategoryGrid` content is top-aligned | ❌ |
| **Individual NoteCard** | ❌ not implemented — no double-click snap at the card level | ❌ title + content top-pinned | ❌ |
| **Empty panel state** | N/A | ✅ `flex items-center justify-center` | ✅ |

#### Exact fixes required

**Fix 1 — Grid math bug (`BoardView.tsx` line 512)**
```ts
// BROKEN (divides by rowHeight only, ignores gap):
const hNeeded = Math.ceil((pixelHeight + 14) / 34);
// CORRECT:
const hNeeded = Math.ceil((pixelHeight + 14) / 48); // 34px row + 14px gap
```

**Fix 2 — Timer panel snap formula (`CategoryPanel/index.tsx`)**
- Add class `timer-snap-root` to the root element of `TimerNote.tsx`
- In the `handleDoubleClick` snap branch, add a timer-specific path:
```ts
if (category.type === 'timer') {
    const timerEl = root.querySelector('.timer-snap-root') as HTMLElement;
    const headerOff = (root.querySelector('.panel-header') as HTMLElement)?.offsetHeight ?? 60;
    requiredPixelHeight = headerOff + (timerEl?.scrollHeight ?? 200) + 24;
}
```

**Fix 3 — Note-grid panel snap formula (`CategoryPanel/index.tsx`)**
- Verify `notes-grid-container` is the actual class on `CategoryGrid`'s root div (check `CategoryGrid.tsx`)
- If the class is wrong or missing, add it explicitly
- The formula is otherwise correct: `header.offsetHeight + notesGrid.offsetHeight + 24`

**Fix 4 — Note-grid panel vertical centering (`CategoryGrid.tsx` / content wrapper)**
- The grid of note cards should be wrapped in a `flex flex-col justify-center h-full` container so it centers vertically when there's extra space

**Fix 5 — Per NoteCard snap (new — `CategoryGrid.tsx` + `NoteCard.tsx`)**
- Mirror the panel snap system at the inner grid level
- Each NoteCard needs a double-click on its inner-grid resize handle to call an `onCardAutoResize(noteId, pixelHeight)` callback
- `CategoryPanel/index.tsx` handles this by applying the snap to the inner `layouts` state (same pixel→grid math, but using the inner grid's `rowHeight`)
- Measure: `titleEl.offsetHeight + divider(1px) + contentEl.scrollHeight + badges(if any) + padding`

**Fix 6 — NoteCard vertical centering (`NoteCard.tsx`)**
- The content layer (`relative z-10 flex-1 flex flex-col h-full`) already stretches full height
- Change the inner `px-5 pt-5 flex-1 flex flex-col overflow-hidden` wrapper to use `justify-center` when the note has both title and content, so equal padding appears top and bottom
- When the note has no title or no content, keep top-aligned

**Fix 7 — Checklist corner snap + horizontal snap (`CategoryPanel/index.tsx`)**
- Corner handle: must compute both `requiredPixelHeight` AND `requiredPixelWidth` simultaneously (currently the height branch exits early without checking `isCornerHandle` for width)
- Horizontal (right/left) handle: text-width measurement already exists but the guard `isRightHandle || isLeftHandle` must be confirmed to match the actual CSS class names on the handles

**Work items (ordered for implementation):**
- [ ] Fix 1 — grid math bug in `BoardView.tsx` (foundational, fixes all snap accuracy)
- [ ] Fix 2 — timer panel snap formula
- [ ] Fix 3 — note-grid panel snap formula audit
- [ ] Fix 4 — note-grid panel vertical centering
- [ ] Fix 5 — per NoteCard snap system
- [ ] Fix 6 — NoteCard vertical centering
- [ ] Fix 7 — checklist corner + horizontal snap

---

## Phase 7 — Dashboard Grid (outer shell)
*Scope: the board-level layout, snapping, and responsiveness.*

- [x] Snap math verified (unit tests passing — 9/9)
- [ ] Default placement for newly created categories
- [ ] Resize handles: which directions feel right
- [ ] **Dual-layout schema** — extend the layout persistence format to store two independent note-grid layouts per category: `dashboardLayout` (note positions when panel is a small dashboard tile) and `fullscreenLayout` (note positions when panel is fullscreened). Both should be saved separately and restored when switching views.
- [ ] **Screen-size layout persistence** — key layouts by screen-size breakpoint (`< 768px` / `768–1440px` / `> 1440px`). localStorage is already device-scoped, so this covers "per device + per screen size" without a device ID. Layouts for each breakpoint persist independently.
- [ ] **Free placement grid** — disable upward compaction so users can place categories anywhere on the visible grid (including leaving empty rows). Overlap is still prevented; items simply don't get pulled upward automatically. Apply to all grids in the app (main dashboard + inner note grids).
- [ ] Layout persistence: localStorage schema, migration on category add/delete
- [ ] Responsive breakpoints: check each of `lg / md / sm / xs / xxs`
- [ ] Drag handle visibility and UX
- [ ] `autoResize` callback — audit pixel → grid-unit conversion accuracy for all widget types (see Phase 6 content-fit snap table)

---

## Phase 8 — Visual Polish (all dashboard elements)
*Scope: make every visible element look intentional, refined, and consistent. No functional changes — pure UX/visual quality.*

### Checklist widget *(mostly done by user)*
- [/] Corner snap — widget corners should lock to grid corners cleanly
- [/] Horizontal snap — widget should snap correctly on horizontal resize

### Category panels
- [ ] Panel border radius, shadow, and glass effect consistency
- [ ] Header height / padding uniformity across widget types
- [ ] Hover states on panel header icons (edit, delete, add)
- [ ] Empty-state illustration / copy feels premium
- [ ] Transition when entering / leaving fullscreen view is smooth

### Note cards (all types)
- [ ] Card shadow depth and hover lift feel premium
- [ ] Title overflow / truncation is elegant (fade out, not hard clip)
- [ ] Color tint bleed looks correct across dark backgrounds
- [ ] Badge chips (Song, Demo, Checklist, Reminder) alignment and spacing
- [ ] Delete button appearance and hover state consistency across all card types
- [ ] Drag handle appears at the right time (hover) and disappears cleanly

### Modals (Create & Edit)
- [ ] Opening animation (zoom + fade) timing feels snappy not laggy
- [ ] Backdrop blur intensity is correct
- [ ] Title input and editor transition is seamless
- [ ] Bottom toolbar doesn't jump / overlap content on open
- [ ] Color picker and reminder picker positions don't clip on small screens
- [ ] Save/close button sizes and icon alignment are consistent

### Dashboard grid
- [ ] Grid gap and padding feel spacious but not wasteful
- [ ] Widget resize handles are subtle until hovered
- [ ] Drag placeholder / ghost styling matches actual widget style
- [ ] No visual flicker on layout load or after drag-drop

---

## Phase 9 — Right Sidebar Removal ✅
*Scope: eliminate the right sidebar entirely and move its content into the left sidebar.*

The `SystemStats` right panel (network latency, database counts, note distribution) takes up valuable horizontal space. All of its content should be accessible from a popover/modal triggered by a button in the left sidebar footer — next to the existing Settings and Profile buttons.

### Layout changes
- [x] **Add "System Overview" button to left sidebar footer** (`Sidebar.tsx`) — use the `analytics` icon; placed between Settings and the user profile row
- [x] **Create `SystemStatsPopover` component** — a popover or slide-out panel that renders the same stats cards (Network, Database, Distribution) currently in `SystemStats.tsx`; triggered by the new sidebar button
- [x] **Remove right sidebar from `MainLayout.tsx`** — delete the right sidebar `<div>` wrapper, `SystemStats` import, and all `rightCollapsed` / `RIGHT_*` state and localStorage logic
- [x] **Delete or repurpose `SystemStats.tsx`** — extract reusable stat cards into the new popover; remove the old collapsed/expanded strip UI
- [x] **Reclaim horizontal space** — main content area should now stretch edge-to-edge between left sidebar and window boundary
- [x] **Verify responsive behaviour** — ensure the layout still works at all breakpoints without the right panel

---

## Phase 10 — Authentication
*Scope: user registration, login, session management, and profile UI.*

The left sidebar already has a hardcoded "Admin User / Pro Plan" profile button (`Sidebar.tsx` lines 109-119). This phase replaces that static stub with real authentication.

### Backend
- [ ] **User model** — add `User` table to Prisma schema (`id`, `email`, `displayName`, `passwordHash`, `avatarUrl`, `plan`, `createdAt`, `updatedAt`)
- [ ] **Auth service** (`AuthService.ts`) — registration (bcrypt hash), login (credential verification), token generation (JWT access + refresh tokens)
- [ ] **Auth controller** (`AuthController.ts`) — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [ ] **Auth middleware** (`auth-middleware.ts`) — JWT verification middleware; attach `req.user` to all protected routes
- [ ] **Protect existing routes** — add auth middleware to all category and note endpoints; scope queries to the authenticated user (`WHERE userId = ?`)
- [ ] **User-scoped data** — add `userId` foreign key to `Category` and `Note` models; migrate existing data

### Frontend
- [ ] **Auth context** (`AuthContext.tsx`) — stores JWT, user info, `login()` / `register()` / `logout()` methods; persists tokens in `localStorage` or `httpOnly` cookies
- [ ] **Login page** (`/login`) — email + password form, error handling, redirect to `/board` on success
- [ ] **Registration page** (`/register`) — email + password + display name, validation, auto-login on success
- [ ] **Protected routes** — wrap `MainLayout` in an auth guard; redirect unauthenticated users to `/login`
- [ ] **Profile button wiring** (`Sidebar.tsx`) — replace hardcoded "Admin User" with real user data from auth context; clicking opens a profile dropdown with "My Account" and "Log Out"
- [ ] **Profile page / modal** — edit display name, avatar, change password
- [ ] **Token refresh** — auto-refresh expired access tokens using the refresh token; logout on refresh failure

---

## Phase 11 — Security Hardening & Pen Testing
*Scope: audit and harden the full stack against common web vulnerabilities.*

### Automated security audit
- [ ] **Dependency audit** — run `npm audit` on both `frontend/` and `backend/`; fix all high/critical vulnerabilities
- [ ] **Static analysis** — add ESLint security plugins (`eslint-plugin-security`, `eslint-plugin-no-unsanitized`) and fix findings
- [ ] **Secret scanning** — verify no API keys, tokens, or credentials are committed; add `.env` to `.gitignore` if not already

### Backend hardening
- [ ] **Rate limiting** — add `express-rate-limit` to auth endpoints (login, register) and API endpoints
- [ ] **CORS policy audit** — verify CORS origin whitelist is explicit (no wildcard `*` in production)
- [ ] **Helmet.js** — add `helmet` middleware for HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] **Input validation audit** — verify all endpoints use Zod schemas; no raw `req.body` property access without validation
- [ ] **SQL injection** — confirm Prisma parameterized queries are used everywhere; no raw SQL string concatenation
- [ ] **Auth token security** — short-lived access tokens (15 min), `httpOnly` / `Secure` / `SameSite` cookie flags for refresh tokens
- [ ] **Error handling** — ensure stack traces and internal errors are never leaked to the client in production
- [ ] **File upload validation** — if audio/image uploads exist, validate MIME types, enforce size limits, sanitize filenames

### Frontend hardening
- [ ] **XSS audit** — verify no `dangerouslySetInnerHTML` without sanitisation; audit TipTap editor output rendering
- [ ] **CSRF protection** — if using cookies for auth, implement CSRF tokens
- [ ] **Content Security Policy** — configure CSP headers to prevent inline script injection
- [ ] **Sensitive data in localStorage** — audit what is stored; prefer `httpOnly` cookies for tokens

### Penetration testing
- [ ] **OWASP Top 10 manual check** — test each category against the running app:
  - [ ] A01: Broken Access Control — try accessing other users' notes/categories without auth
  - [ ] A02: Cryptographic Failures — verify passwords are hashed (bcrypt), tokens are signed (JWT RS256 or HS256 with strong secret)
  - [ ] A03: Injection — attempt SQL injection, NoSQL injection, command injection on all inputs
  - [ ] A04: Insecure Design — verify business logic (can a user delete another user's data?)
  - [ ] A05: Security Misconfiguration — check default credentials, open endpoints, debug modes
  - [ ] A06: Vulnerable Components — verify `npm audit` findings are resolved
  - [ ] A07: Auth Failures — test brute-force login, session fixation, token reuse after logout
  - [ ] A08: Data Integrity — verify data cannot be tampered with in transit (HTTPS)
  - [ ] A09: Logging & Monitoring — verify auth failures and suspicious activity are logged
  - [ ] A10: SSRF — if any URL-fetching features exist (e.g. link previews), test for SSRF
- [ ] **Automated scanner** — run OWASP ZAP or similar against the local dev server and triage findings
- [ ] **Report & remediate** — document all findings with severity ratings; fix critical/high before shipping

---

## Phase 12 — Future Widget Roadmap
*These are not scheduled yet — captured here so they don't get lost.*

### Interactive Utilities
- [ ] **Counter Tracker** — big +/− buttons, tracks a running count (habits, reps, glasses of water). Stores history.
- [ ] **Calculator Scratchpad** — inline math evaluator: type `15 * 52`, get the answer inline. Stores calculation history.

### Embedded Media & Content
- [ ] **Quick Draw / Canvas Note** — blank canvas for mouse/finger sketching and diagrams.
- [ ] **Link / Bookmark Card** — paste a URL, auto-fetches OG image + title + description, displays as a clickable preview card.
- [ ] **Code Snippet Note** — syntax highlighting, copy-to-clipboard, auto-formatting (like a GitHub Gist).

### Organisation & Planning
- [ ] **Mini Calendar / Event Note** — month view or countdown to a date (e.g. "Days until Vacation: 14").
- [ ] **Kanban / Progress Bar Note** — tracks a single goal with a progress bar and percentage (e.g. "Reading: 45 / 100 pages").
- [ ] **Weather Widget** — shows current weather for a configured city/zip.

---

## How to work through this

1. Tell me which phase / widget you want to tackle.
2. I'll list all known issues in that phase and ask you to confirm / add more.
3. We fix them one at a time, with a quick browser check after each.
4. We mark items `[x]` and move on.

> [!TIP]
> Start with the widget you interact with most day-to-day — pain points there will have the highest return on effort.
