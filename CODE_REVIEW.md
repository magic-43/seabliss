# Code review and corrections

The review found failures in permissions, financial updates, validation, and duplicated sources of truth. The code changes preserve the existing admin design and routes.

| Finding | Correction |
| --- | --- |
| Guests could insert arbitrary booking prices and payment records directly, while the application tried to read records hidden by RLS. | Guest actions validate requests and scope private reads through a server-only service client. Migration 002 removes direct guest writes. |
| Users could update their own role, and initial signups/backfilled users were promoted automatically. | Column permissions allow name edits only; new profiles default to user. Role changes require a superadmin and cannot target the caller. Existing assigned roles are preserved and should be reviewed separately. |
| Booking-date exclusivity prevented management from receiving competing requests. | Migration 004 removes the exclusion constraint, allowing independent overlapping requests while retaining date checks, unique references, and idempotency. Management finalizes accommodation arrangements manually. |
| Repeated or concurrent receipt approvals could double-count money; booking and receipt updates could partially succeed. | Payment submission and review use transactions with booking locks, pending-review checks, replay protection, and overpayment checks. |
| Retired promotion behavior remained in room editing and booking prices. | New bookings use the saved nightly room rate only. Promotion controls, the server action, and promotional room text were removed; migration 003 retires the legacy trigger and RPC. Existing booking totals are preserved. |
| Database errors appeared as empty dashboards, missing rooms, or fallback prices. | Queries check failures explicitly, with an admin error screen and retry action. Pricing fails if settings cannot load. |
| Invalid dates became one-night stays; zero fees were replaced by defaults; form time formats disagreed. | Calendar validation, ordered dates, Manila-based past-date checks, nullish defaults, and native 24-hour time fields. |
| Database clients ignored the existing types, with duplicated interfaces and a deleted table still in the model. | Typed clients, inferred query results, shared action results, derived update types, and removal of the stale table/type aliases. |
| A second static room catalogue overrode saved database values, including empty galleries and descriptions. | Admin pages use database records consistently; the unused duplicate catalogue was removed. |
| Upload size/type validation and cleanup were missing. | Receipt uploads validate a 10 MB limit and supported types, match the action request limit, and remove uploaded files when recording fails. PDFs/HEICs use a receipt link rather than a broken image preview. |
| The initial migration dropped the legacy admin table with CASCADE. | Removed the destructive drop; legacy data is preserved. |
| Admin styling repeated raw colors; labels and save behavior were inconsistent. | Shared Tailwind color tokens, associated labels, stable list keys, and normal form submission for every room save button. |
| The lint script had no configuration and there were no regression checks. | ESLint flat config, a typecheck script, and Node-based tests using the existing TypeScript dependency. |

## Database rollout

The project owner confirmed that migrations 001, 002, and 003 are applied to the target Supabase database. The only new deployment migration is `supabase/migrations/004_allow_overlapping_booking_requests.sql`; production application requires explicit deployment approval. Legacy discount columns remain for compatibility, but the application does not use them for pricing.

Migration 004 removes only `bookings_no_overlapping_stays`; it does not modify historical rows, payment RPCs, or permissions. The existing amount/capacity checks use `NOT VALID` so historical records are preserved while new writes are checked; inspect old data before validating those constraints.

Fresh databases do not automatically assign administrators. An authorized operator must assign the first admin/superadmin in the database. Review existing privileged profiles because the original migration granted admin access broadly; this change does not guess which existing accounts should lose access.

For recoverable booking retries, keep the same `clientRequestId` and a random 32-byte hexadecimal `guestAccessToken` with the request. Omitting the token is supported on first creation; a later retry without the original token returns an explicit recovery error instead of a false success with an empty token.

## Verification

- `npm test`: regression tests for calendar dates, pricing, rounding, zero fees, guest tokens, references, and server input schemas.
- `npm run typecheck`: strict TypeScript checks.
- `npm run lint`: Next.js and TypeScript rules.
- `npm run build`: production compilation and route generation.
- `tests/database.sql`: transactional SQL regression checks for a disposable Supabase database after applying migrations 001 through 004. It rolls back fixtures. Run with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/database.sql`.

The Phase 1 SQL regression suite has now passed on isolated PostgreSQL 18.3 with minimal Supabase auth/storage schema scaffolding. This verifies migrations, constraints, permissions, and payment RPCs, but does not exercise hosted Supabase Auth, PostgREST, Storage uploads, or authenticated browser writes. Earlier admin-shell browser checks are recorded below.

## UI consistency pass

Reviewed every UI file and preserved the deliberate mobile focus pattern: bottom navigation stays hidden on room editing, settings sections, and payment details. Settings opens as a section menu on mobile; an edit screen has one fixed save bar, with safe-area spacing and inline save feedback.

- Shared route metadata gives mobile and desktop headers the same titles, clear back destinations, and consistent navigation highlighting. Invalid section parameters no longer hide navigation.
- The interactive admin shell has one client entry point; its server-rendered page content is passed as children. This reduces independent client references during development refreshes.
- Settings uses grouped cards, visible field labels, appropriate keyboards, meaningful help text, and shared form controls. Switching sections preserves mounted drafts.
- The room editor shares its fields, list editing, and save feedback rather than duplicating desktop/mobile forms and save buttons. Gallery removal works with touch and keyboard without requiring hover.
- Dashboard activity uses one responsive layout. Mobile uses a single summary card and payment history grouped by Manila calendar date. Pending and rejected receipts have explicit status badges and are no longer presented as verified income.
- Room cards show active/inactive labels, wrapping bed descriptions, and show a single nightly rate.
- Payment details use readable date/currency formats, wrapping contact details, selectable receipt history, and a native rejection dialog with focus trapping and Escape support. Closed reservations do not display review actions.
- Login, loading, error, and not-found views follow the same controls and spacing. Authenticated users are redirected away from the login form.
- Navigation and formatting regression tests now cover the focused mobile flow. The suite also checks that legacy promotional data cannot override the nightly rate.

The focused editing flow is covered by navigation regression tests. The recurring development error was subsequently investigated using a local dependency installation and Chrome regression checks, described below.

## Recurring development client-reference error

The development process was using an entire `node_modules` directory linked to another application's checkout. The component exports existed, but generated client module paths included that other application. Clearing build output and rearranging client components did not provide a lasting repair.

Replaced the dependency junction with a local installation from this project's lockfile, corrected the copied project name in the lockfile, and added `scripts/check-dependencies.mjs` as `predev`. Development now refuses a linked or missing installation with an actionable message. Next.js 16.3.3, React 19.2.8, and Webpack were retained for a controlled check; no framework upgrade or bundler change was needed for this repair.

An isolated Chrome check rendered the actual admin shell from a temporary server layout without bypassing admin authentication or accessing resort data. It passed 34 interactive checks across desktop and mobile, including client navigation, reloads, visits to public/login routes, and editing/restoring the actual shell module during hot refresh. There were zero browser errors. The regenerated client references no longer point into the other checkout. The temporary application routes were removed after the check.

The startup guard was checked separately: a local installation was accepted and a junction was rejected. Full authenticated booking/payment behavior is outside this client-loading regression check.

### Stale browser service worker

The original browser continued failing after the dependency repair, while fresh Chrome sessions passed. Development diagnostics confirmed that the affected browser at `http://localhost:3001/admin` was controlled by `http://localhost:3001/sw.js`. Seabliss does not register a service worker. That browser reported modules from the other application and components absent from this repository; neither the current HTTP responses nor generated bundles contained those modules.

The development layout now unregisters leftover workers before reloading a controlled page. It runs independently of React, allowing recovery when cached JavaScript cannot hydrate. A development-only `/sw.js` response also retires the old worker on its next update, covering cached documents that cannot receive the layout change. Cookies, login sessions, and saved browser data are preserved. Production omits the layout script and returns 404 for `/sw.js`.

Three isolated Chrome recovery checks passed with zero browser errors: removing an existing controlling worker, normal hydration without a worker, and retirement through `/sw.js`. The temporary worker fixture was removed after verification. Subsequent diagnostics showed no controlling worker or registrations in the affected browser, and the user confirmed continued use without errors.


## Requested desktop and mobile adjustments

Desktop settings uses plain section links with one selected background, without icons, descriptions, chevrons, or an extra Settings heading. Section back buttons remain visible on mobile only. The mobile settings menu and focused save flow are preserved. The user's subsequent save-button changes were retained.

The mobile dashboard uses a single summary card and compact payment rows grouped by calendar date in Manila. The summary contains total collected, active rooms, and transactions. Desktop uses transactions instead of awaiting review. Pending and rejected receipts keep their status labels; only approved receipts receive a positive collected-payment treatment.

Promotion text and the discount action/validator were removed. New bookings use `regular_rate` alone, including when legacy discounted values are still stored. Migration 003 removes the prior trigger and RPC without changing room prices or historical booking totals; the user confirmed applying it. Database regression checks now expect migrations 001 through 003.

Responsive verification passed 63 checks in isolated Chrome at 1440, 390, and 320 px with sample data and zero browser errors. Checks covered the simple desktop sidebar, mobile-only back buttons, focused navigation, save-button state after editing, retained section drafts, Manila date grouping, receipt statuses, transaction labels, and horizontal overflow. The temporary preview route was removed afterward. This did not exercise authenticated writes to the resort database.


Final checks passed: 19 Node regression tests, ESLint, and the production build (including TypeScript and route generation). A temporary production server returned 200 for the login page without the development cleanup script and 404 for `/sw.js`; the server was stopped after verification. The SQL regression suite and authenticated database writes were not exercised in these checks.


## Phase 1: overlapping booking requests

### A. Initial architecture

`createBookingAction` validates the request, checks a unique client-request identifier, and recovers a prior result only with the original guest access token. It loads an active room and resort fees, rejects past/invalid stay dates and malformed guest input, calculates a saved financial snapshot, and inserts an awaiting-payment booking. References use `SBL-YYYY-XXXX`; database uniqueness and up to five insert attempts handle collisions. No separate date-availability query, occupancy counter, room hold, or expiration mechanism exists.

Migration 002 added `bookings_no_overlapping_stays`, a GiST exclusion constraint on room ID and half-open stay dates for statuses other than rejected/cancelled. Booking creation translated SQLSTATE `23P01` into a date-unavailability message. The old SQL regression suite expected overlap rejection.

Receipts reference a booking ID through a foreign key. `submit_payment_proof` locks that booking, verifies its token and receipt path, creates the receipt, and moves an awaiting-payment request to pending review. `review_payment` locks the booking and selected receipt, verifies the reviewer, and atomically updates the receipt, paid amount, balance, and payment-related booking status. Replays cannot double-count approved money, and overpayments fail.

The dashboard sums booking amounts paid and lists all payment submissions with their joined booking/guest/room details. Payment details load by unique reference and select receipt history from that booking alone. Neither query deduplicates by room/date or excludes overlapping requests. The payment feed continues to show a request after its receipt is submitted, as before.

### B. Phase 1 file changes

- `supabase/migrations/004_allow_overlapping_booking_requests.sql` (new): removes only the date-exclusion constraint in a transaction.
- `src/app/actions/booking.ts`: removes the obsolete `23P01` date-unavailability branch; retains unique-key retry/recovery and safe generic database-error handling.
- `tests/booking.test.ts`: adds valid identical/partial-overlap request inputs and extends malformed input/guest-bound validation coverage.
- `tests/database.sql`: replaces overlap rejection with scenarios A-F, including independent receipts/reviews, date and guest checks, token/path protection, unique requests/references, and existing payment safeguards.
- `tests/local-postgres-bootstrap.sql` (new): minimal auth/storage schema scaffolding for a new disposable PostgreSQL test database; does not emulate Supabase services or change production.
- `tests/migration004.sql` (new): reproduces the pre-004 rejection, preserves sentinel data/security snapshots, applies 004, checks harmless reapplication, runs the SQL suite, and verifies data/security preservation.
- `CODE_REVIEW.md`: updates the architecture/deployment notes and records this implementation report.

Existing working-tree UI edits were preserved. Migrations 001-003, payment/admin actions, pricing, access tokens, date/reference helpers, and admin/public pages were not changed by Phase 1. No packages were added.

### C. Database migration

The owner confirmed migrations 001-003 are already applied to the target Supabase database. Migration 004 executes `ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_overlapping_stays` inside a transaction. Existing booking/payment records are retained. Date validity, foreign keys, unique references and request IDs, RLS, policies, grants, payment functions, and their transaction locks remain intact. The `btree_gist` extension is left installed. Migration 004 has been applied only to disposable local test databases, not production.

### D. Updated lifecycle

Different guests can request the same room with identical or partially overlapping dates using distinct client request IDs. Each request gets its own reference, token, guest information, and price snapshot. Each guest then uploads proof against their own booking; management reviews each receipt independently. Existing `approved` status remains a payment-review outcome; it is not a guaranteed room allocation or automatic stay confirmation. Management finalizes arrangements directly with guests.

The project owner explicitly confirmed keeping the current extra-guest policy: `max_guests` is the included allowance for pricing, with a per-night extra-person fee above it. This phase does not introduce a hard room-capacity limit or change deposits/half-payment calculations. Existing input bounds remain enforced.

### E. Preserved functionality

Bookings, receipts, guest details, references, request idempotency, token verification, upload type/size validation, private storage and signed receipt URLs, failed-record upload cleanup, service-only payment RPCs, admin authentication/role checks, transaction locks, payment replay/overpayment safeguards, room management, settings, and dashboard statistics remain in place. No public wizard, automatic allocation, expiration, cancellation, or confirmation system was added.

### F. Verification

- `npm test`: 20 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript and generation of every existing admin route.
- Database integration: scenarios A-F passed twice on fresh, isolated PostgreSQL 18.3 databases with minimal Supabase auth/storage schema scaffolding. Both runs reproduced rejection before 004, accepted overlap afterward, preserved idempotency/validation/payment separation, and verified unchanged existing rows, other constraints, RLS, permissions, and payment RPC definitions.
- Disposable databases were deleted and their separate localhost PostgreSQL instance was stopped after verification. The existing PostgreSQL service and target Supabase database were not modified.
- Hosted Supabase Auth/PostgREST/Storage, actual file uploads, complete Server Action HTTP round trips, concurrent Server Action retries, and authenticated browser payment review were not exercised. No real customer records or payments were used. SQL idempotency checks verify database uniqueness and recovery lookup; the existing action-level retry/token code was inspected and preserved.

To repeat the SQL migration suite, use a fresh disposable Supabase database with migrations 001-003 and an empty booking/payment ledger, then run `psql -X --dbname=DISPOSABLE_TEST_DATABASE_URL -v ON_ERROR_STOP=1 -f tests/migration004.sql`. Its name must begin with `seabliss_phase1_`. For plain PostgreSQL, first run `tests/local-postgres-bootstrap.sql`, then migrations 001-003. A fresh standalone PostgreSQL instance is recommended for those test-only roles. For a disposable database already on 004, run `tests/database.sql` instead.

### G. Deployment requirements

Obtain explicit production deployment approval before applying migration 004. Confirm the intended target and an available backup, then apply only `004_allow_overlapping_booking_requests.sql` using the project's migration process. It takes a brief table-schema lock; schedule accordingly. Do not rerun migrations 001-003 against the existing target. Verify the exclusion constraint is absent and the unique/date constraints and payment RPC permissions remain, then deploy the booking-action update. Run hosted Auth/Storage/payment-flow checks in staging using synthetic guests and receipts before customer rollout. No production test bookings or payment transactions are required.

### H. Remaining risks

Multiple guests may submit real payments for the same accommodation/dates. Management must reconcile those requests, communicate availability, and arrange any refund or alternative stay; payment verification alone does not allocate accommodation. Restoring date exclusivity later would require reconciling overlaps before adding such a constraint. The existing four-digit yearly reference suffix and five collision attempts remain unchanged. The deployment and hosted-service checks above remain outstanding.

### I. Phase 2 readiness

The backend is ready for Phase 2 development, subject to approved deployment of 004 and staging end-to-end verification before a customer-facing booking release. The existing inputs and action responses remain compatible with accommodation selection, guest information, review, and payment steps. No homepage or booking wizard was developed.

After successful proof submission, the future interface must explain that availability is not guaranteed and display:

> Your booking request and payment proof have been submitted successfully. Our management team will review your submission and contact you to finalize your stay.

## Phase 2: Approved Seabliss homepage implementation

The owner's latest reference, `seabliss-desktop-concept.png`, supersedes the In Residence/Casa Mare directions and both rejected homepage compositions. This report describes the final local implementation, not the earlier rejected designs.

### History and scope

Git history was inspected across all available commits for the public homepage. The initial commit (`161a2c0`) contains only a centred placeholder and a management link; the other commit changes attributes. No committed implementation matching the approved mockup exists. The approved presentation was therefore recreated directly; it was not restored from Git. No repository reset, checkout of unrelated files, deployment, or database migration was performed.

Existing Phase 1, admin dashboard, test, and user working-tree edits were preserved. Public presentation was replaced while retaining the working public data access, validated contact links, route group, fonts, shared design tokens, and menu/FAQ accessibility.

### Architecture

The single homepage route remains `src/app/(public)/page.tsx`. Its public layout owns the header/footer and metadata; its stylesheet is scoped to `.public-site`. The shared root layout, globals, and admin routes are unchanged.

Server Components compose the homepage and render real accommodation cards. Request-cached, server-only Supabase reads supply current active rooms and public resort settings. Client Components provide native accommodation scrolling and inline expansion, the mobile dialog, FAQ state, and progressive reveals. No dependency or global state was added.

### Files changed for the approved design revision

| File | Final change |
| --- | --- |
| `src/app/(public)/page.tsx` | Retains the approved section order and presents four verified homepage FAQ entries. |
| `src/app/(public)/public.css` | Replaces the rejected visual system with the reference's cream surfaces, full-width hero, generous section proportions, gold/teal controls, three-card rail, split gathering section, banner, footer columns, and responsive layouts. All styles remain public-scoped. |
| `src/components/public/home-sections.tsx` | Recreates hero, story, photographic experiences, private gatherings, and reservation banner according to the approved composition. |
| `src/components/public/header.tsx` | Transparent navigation over the hero, actual Seabliss branding, section links, gold reservation action, and responsive menu trigger. |
| `src/components/public/mobile-menu.tsx` | Matches brand/CTA styling while retaining dialog semantics, focus wrapping/restoration, Escape, close controls, and background scroll locking. |
| `src/components/public/accommodation-showcase.tsx` | Real room photographs, names, nightly rates, included guest allowances, and selected amenities in three desktop cards. |
| `src/components/public/accommodation-rail.tsx` | Recreates the native horizontal carousel with edge-aware controls and a working View All action that expands all active records inline. This was recreated locally, not restored from a historical implementation. |
| `src/components/public/faq-section.tsx` | Reference-style editorial heading left and accessible accordion right; mobile stacks the two. |
| `src/components/public/footer.tsx` | Deep teal, authentic brand, Explore/About columns, database-backed contacts/socials, divider, copyright, and working links only. |
| `src/components/public/accommodation-gallery.tsx` | Removes the rejected single-stay editorial gallery. This was an untracked component from the superseded redesign. |
| `CODE_REVIEW.md` | Replaces the superseded Phase 2 design report with this final report. |

Existing public foundation files (`layout.tsx`, `loading.tsx`, `brand.tsx`, `reveals.tsx`, `src/lib/public/data.ts`, `src/lib/public/content.ts`, and `tests/public-content.test.ts`) remain in use. The pre-existing replacement of the root placeholder by the public route group remains intact. Original photography was not modified.

QA scripts, screenshots, and read-only public-data snapshots are under ignored `.runtime-check/`; they are not imported into the application. No hardcoded accommodation catalogue was introduced.

### Visual implementation and differences from the reference

The final page follows the approved reference's entire sequence: transparent navigation and left-aligned two-action hero; cream story with photograph left; centred accommodation introduction and three desktop cards; introduction left with three photographic experience tiles right; half-image/half-teal private gathering invitation; cream split FAQ; centred photographic reservation banner; deep teal columned footer.

Cormorant Garamond and Plus Jakarta Sans remain the project's fonts. The existing brand palette supplies navy, coastal teal, sand gold, and warm cream surfaces. The rejected rounded hero frame, centred oversized editorial arrival, staggered introduction, single-stay gallery, large teal editorial passage, and white centred footer were removed.

Required factual/asset differences:

- The mockup's sunset beach property, dining/event photographs, wave logo, decorative leaf imagery, prices, sample contacts, and location were not substituted for real Seabliss content.
- Genuine aerial villa/pool photography supplies desktop arrival; a real portrait pool/coast photograph supplies mobile arrival. Actual terrace, dining, lounge, and pool photographs supply the remaining sections. Some source photographs are only approximately 602 px wide; their sharpness limits large display fidelity.
- The existing authentic emblem/wordmark replaces the mockup's fictional wave logo. The cream surfaces use CSS rather than an unavailable exact textured/leaf-shadow asset.
- Seven active records use current Supabase order, names, rates, and included-guest allowances. `max_guests` is not misrepresented as a hard maximum; the existing extra-guest policy is preserved.
- Verified dining and private pools replace the unverified Activities offering. Dining appears only when supported by current room features.
- Four FAQ answers use verified location, management arrangements, arrival times, and extra-person fee information rather than copying unverified mockup payment policies.
- View All expands all seven records inline. Reservation and inquiry actions reach verified management contacts rather than unbuilt routes.
- No nonexistent legal pages, YouTube account, or administrative links appear in the footer. Contact and social details come from settings.

### Responsive behavior and accessibility

Desktop at 1440 px shows three complete cards; tablet shows two; mobile shows a large card and a preview of the next. Guests can use touch scrolling or labelled previous/next buttons, then expand the full collection into a responsive grid.

The mobile site has a conventional hamburger header, cropped portrait hero, readable stacked CTAs, photo-first story, stacked experience imagery, split-to-stacked gatherings/FAQ, and spaced footer columns. There is no mobile bottom navigation, fixed booking bar, dock, or persistent toolbar.

The menu uses a native modal dialog with accessible labels, explicit Tab wrapping, Escape handling, focus restoration, and scroll locking. FAQ buttons expose expanded state, labelled panels, and hidden/inert closed content. Semantic sections, one H1, a skip link, descriptive alt text, focus-visible outlines, reduced-motion handling, and progressive enhancement remain in place. No screen-reader or physical-device audit was performed.

### Data, destinations, and protected systems

The existing RLS-aware Supabase client reads active `rooms` and a public-only projection of `resort_settings`. No service-role access, booking/guest/payment reads, or database writes were added.

Management contacts are selected centrally by `getContactLinks`: configured Facebook, then email, telephone, and the valid contact section as fallback. Hero/header/menu/banner, room inquiries, private buyout, and footer actions all have working destinations. The carousel's View All control is functional without a new route.

All 29 protected admin, actions, Supabase, migration, shared layout/global-style, and database-type files match their starting SHA-256 hashes. Existing booking/payment/authentication logic, RLS, migrations, and admin functionality were not modified. Migration 004 was not applied. No production deployment or real customer/payment transaction was performed.

### Verification actually executed

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed. The first pass exposed two unsupported social-icon imports; they were corrected and validation rerun successfully. |
| `npm.cmd run lint` | Passed, including a rerun after the final source correction. |
| `npm.cmd test` | All 25 existing tests passed; zero failures. |
| `npm.cmd run build` | Passed using Next.js 16.3.3 Webpack. Homepage and all existing admin routes compile. |
| Responsive Chrome browser checks | 411 assertions passed at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 px. Zero console/page errors and zero failed optimized images. |
| Touch-emulated Chrome | 10 assertions passed: hamburger, section navigation, scroll restoration, carousel, View All/collapse, FAQ, and menu close. An initial menu-opening timeout was investigated; rerun after waiting for page/font readiness passed without a product change. |
| Local production verification | 24 assertions passed against live public data, simulated API failure, and an empty active-room list; zero browser errors. |
| Admin compatibility | Login renders and hydrates, password visibility control works, protected settings redirects unauthenticated requests to login, and public styling/wrappers are absent. |
| Protected-file audit | 29 of 29 unchanged. |
| Working-tree whitespace check | `git diff --check` passed; Git prints existing CRLF normalization warnings. |

Browser checks cover real names/rates/included guests, all seven room photos, all link destinations, default card counts, carousel controls, inline expansion/collapse, FAQ behavior, mobile focus/Escape/scroll restoration, reduced motion, overflow before/after interaction, and admin authorization boundaries.

The in-app browser connection failed at initialization; isolated headless Chrome was used. Safari/Firefox, real mobile devices, external management messaging, authenticated admin operations, and actual booking/payment submissions were not exercised. Database integration tests were not rerun because database/backend files are unchanged and this task excludes migrations and transaction testing.

A production fallback test initially treated the Explore Accommodations anchor as a reservation contact link. The test was corrected to distinguish those destinations, and all three production modes then passed.

### Actual screenshots and visual review

Screenshots were captured from the local production build without development overlays. The complete desktop/mobile pages and menu were reviewed, including normal-size hero and lower-page sections. They follow the approved reference's layout hierarchy rather than the superseded editorial direction.

- [Desktop full homepage, 1440 px](.runtime-check/spacing-screenshots/home-1440.png)
- [Mobile full homepage, 390 px](.runtime-check/spacing-screenshots/home-390.png)
- [Mobile menu, 390 px](.runtime-check/spacing-screenshots/mobile-menu-390.png)
- Additional responsive captures: [1920 px](.runtime-check/spacing-screenshots/home-1920.png), [430 px](.runtime-check/spacing-screenshots/home-430.png).
- Verification records: [responsive](.runtime-check/spacing-browser-result.json), [touch](.runtime-check/approved-touch-result.json), [production](.runtime-check/spacing-production-result.json).

### Outstanding limitations and stopping point

The future accommodation catalogue/detail pages, dedicated buyout page, legal pages, and four-step booking wizard remain out of scope. Current management links are intentional interim destinations. When those approved routes exist, update the relevant actions individually; keep buyout inquiries directed to management until their dedicated experience exists.

`NEXT_PUBLIC_APP_URL` currently points to localhost. Set the verified public origin before a future publication so canonical/OpenGraph URLs are correct. Higher-resolution real photography and any approved production logo/decorative assets would improve exact mockup fidelity.

The homepage is complete locally for owner review. No accommodation detail pages, booking wizard, database deployment, or website deployment was started.

### Spacing, full-height hero, and link readability follow-up

Normal-size browser rendering was too compressed. This CSS-only presentation follow-up preserves the approved layouts and replaces the shallow section proportions with a consistent responsive spacing scale. Only `src/app/(public)/public.css` and this report changed.

- The hero uses `min-height: 100svh` on desktop and mobile, filling the screen while allowing content to grow on short displays. No maximum-height cap cuts it short.
- Main sections use 64-112 px vertical padding on desktop and 56 px on mobile. Story, room, and experience photographs have taller aspect ratios; card content, section headings, controls, and copy have more breathing room.
- Desktop private gatherings has a 480 px photographic minimum. The reservation invitation has a 400 px desktop minimum and 440 px mobile minimum. Footer padding and link spacing are increased.
- Header and footer navigation links are 14 px; primary buttons and text links are larger. Navigation gaps were measured at 1280 and 1440 px to confirm the larger text does not overlap.
- The final production build passed, including its TypeScript check. The responsive browser suite passed 411 checks at all nine widths, explicitly verifying viewport-height arrival, larger link fonts, header separation, menus, carousel/expansion, FAQ, image loading, overflow, reduced motion, live data, and admin isolation. All 24 production checks also passed for live/failure/empty data. No browser errors or failed images were detected. The prior automated unit tests and touch results above concern unchanged application logic; they were not rerun for this CSS-only follow-up.
- Final full-page captures are the `spacing-screenshots` links above. All 29 protected files again matched their starting hashes. Backend logic, data, admin, migrations, and authentication remain unchanged.
