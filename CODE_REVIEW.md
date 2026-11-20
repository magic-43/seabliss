# Code review and corrections

The review found failures in permissions, financial updates, validation, and duplicated sources of truth. The code changes preserve the existing admin design and routes.

| Finding | Correction |
| --- | --- |
| Guests could insert arbitrary booking prices and payment records directly, while the application tried to read records hidden by RLS. | Guest actions validate requests and scope private reads through a server-only service client. Migration 002 removes direct guest writes. |
| Users could update their own role, and initial signups/backfilled users were promoted automatically. | Column permissions allow name edits only; new profiles default to user. Role changes require a superadmin and cannot target the caller. Existing assigned roles are preserved and should be reviewed separately. |
| Availability checks raced with other reservations. | A database exclusion constraint rejects overlapping active stays while allowing adjacent checkout/check-in dates. |
| Repeated or concurrent receipt approvals could double-count money; booking and receipt updates could partially succeed. | Payment submission and review use transactions with booking locks, pending-review checks, replay protection, and overpayment checks. |
| Room edits silently removed promotions; global discount updates ignored individual failures. | A database trigger keeps base-rate edits consistent with the configured discount; a single transaction updates the global promotion and room rates. Zero-rate promotions remain valid. |
| Database errors appeared as empty dashboards, missing rooms, or fallback prices. | Queries check failures explicitly, with an admin error screen and retry action. Pricing fails if settings cannot load. |
| Invalid dates became one-night stays; zero fees were replaced by defaults; form time formats disagreed. | Calendar validation, ordered dates, Manila-based past-date checks, nullish defaults, and native 24-hour time fields. |
| Database clients ignored the existing types, with duplicated interfaces and a deleted table still in the model. | Typed clients, inferred query results, shared action results, derived update types, and removal of the stale table/type aliases. |
| A second static room catalogue overrode saved database values, including empty galleries and descriptions. | Admin pages use database records consistently; the unused duplicate catalogue was removed. |
| Upload size/type validation and cleanup were missing. | Receipt uploads validate a 10 MB limit and supported types, match the action request limit, and remove uploaded files when recording fails. PDFs/HEICs use a receipt link rather than a broken image preview. |
| The initial migration dropped the legacy admin table with CASCADE. | Removed the destructive drop; legacy data is preserved. |
| Admin styling repeated raw colors; labels and save behavior were inconsistent. | Shared Tailwind color tokens, associated labels, stable list keys, and normal form submission for every room save button. |
| The lint script had no configuration and there were no regression checks. | ESLint flat config, a typecheck script, and Node-based tests using the existing TypeScript dependency. |

## Database rollout

Apply `supabase/migrations/002_booking_integrity.sql` after migration 001 **before using the changed booking/payment actions**. It creates the transaction functions those actions call. It has not been applied to the connected database in this session.

The overlap constraint deliberately fails if historical active reservations overlap. Reconcile those records before retrying. The additional amount/capacity checks use `NOT VALID` so existing records are preserved while new writes are checked; inspect old data before validating those constraints.

Fresh databases do not automatically assign administrators. An authorized operator must assign the first admin/superadmin in the database. Review existing privileged profiles because the original migration granted admin access broadly; this change does not guess which existing accounts should lose access.

For recoverable booking retries, keep the same `clientRequestId` and a random 32-byte hexadecimal `guestAccessToken` with the request. Omitting the token is supported on first creation; a later retry without the original token returns an explicit recovery error instead of a false success with an empty token.

## Verification

- `npm test`: regression tests for calendar dates, pricing, rounding, zero fees, guest tokens, references, and server input schemas.
- `npm run typecheck`: strict TypeScript checks.
- `npm run lint`: Next.js and TypeScript rules.
- `npm run build`: production compilation and route generation.
- `tests/database.sql`: transactional SQL regression checks for a disposable Supabase database after applying both migrations. It rolls back fixtures. Run with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/database.sql`.

The SQL regression script has not been executed here: a local PostgreSQL/Supabase test database is unavailable. Admin-shell browser-loading checks are recorded below; full authenticated booking/payment interactions remain unverified.

## UI consistency pass

Reviewed every UI file and preserved the deliberate mobile focus pattern: bottom navigation stays hidden on room editing, settings sections, and payment details. Settings opens as a section menu on mobile; an edit screen has one fixed save bar, with safe-area spacing and inline save feedback.

- Shared route metadata gives mobile and desktop headers the same titles, clear back destinations, and consistent navigation highlighting. Invalid section parameters no longer hide navigation.
- The interactive admin shell has one client entry point; its server-rendered page content is passed as children. This reduces independent client references during development refreshes.
- Settings uses grouped cards, visible field labels, appropriate keyboards, meaningful help text, and shared form controls. Switching sections preserves mounted drafts.
- The room editor shares its fields, list editing, and save feedback rather than duplicating desktop/mobile forms and save buttons. Gallery removal works with touch and keyboard without requiring hover.
- Dashboard activity uses one responsive layout. Pending and rejected receipts have explicit status badges and are no longer presented as verified income.
- Room cards show active/inactive labels, wrapping bed descriptions, and distinguish base rates from promotions.
- Payment details use readable date/currency formats, wrapping contact details, selectable receipt history, and a native rejection dialog with focus trapping and Escape support. Closed reservations do not display review actions.
- Login, loading, error, and not-found views follow the same controls and spacing. Authenticated users are redirected away from the login form.
- Navigation and formatting regression tests now cover the focused mobile flow. The complete suite has 18 passing tests.

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
