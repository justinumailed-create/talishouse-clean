# Talishouse / TalisPros Platform — Implementation Report

**Prepared for:** Ralf Meyer  
**Date:** June 22, 2026  
**Type:** Comprehensive Implementation Audit

---

## Executive Summary

### What Has Been Built

The Talishouse/TalisPros platform is a full-stack web application that serves two main audiences:

1. **Consumers** — Browse products (Glasshouse, Talishouse, TalisTowns), configure builds, get pricing, and apply for lease-to-own financing through the TalisBOT assistant or web forms.
2. **Wholesale Partners & Associates** — Generate FAST Codes, access Mapsites™ (geospatial landing pages), submit build requests, and manage the production pipeline through admin, CRM, and associate dashboards.

The platform is built with **Next.js 16** (the latest version), React 19, Supabase (PostgreSQL database + file storage), PayPal for payments, and Resend for transactional emails. It is deployed on Vercel.

### What Is Currently Working

| Feature | Status |
|---|---|
| Public website (home, products, catalog) | Production Ready |
| Product configurators (Glasshouse, Talishouse) | Production Ready |
| TalisBOT lead capture chatbot | Production Ready |
| FAST Code generator (/fast-code) | Production Ready |
| Partner Access portal (/partner-access) | Production Ready — iframe embeddable |
| Mapsite™ public pages (/ma/[fastcode]) | Functional — shows all assets and data |
| Build a Mapsite™ form (/build-mapsite) | Built — needs database deployment |
| Admin console (20 pages) | Built — needs database deployment |
| CRM (9 pages with roles) | Built — needs database deployment |
| Associate dashboard | Built — needs database deployment |
| Email notification system (4 templates) | Built — Resend configured |
| Production Queue kanban board | Built — needs database deployment |

### What Has Been Stabilized

The **Partner Access** and **FAST Code Generator** pages have undergone extensive stabilization work to support iframe embedding by wholesale partners. This included:

- White background and flat form styling for clean embed rendering
- Removal of global site chrome (header, footer, chat widget) on embed pages
- iframe breakout logic for registration redirects
- State/Province field added for US/Canada support
- Windswept logo implementation
- SEO metadata updates (OG images, titles, descriptions)
- Mobile responsiveness improvements

### What Remains Under Development

The **TalisPros Build System** — a new suite of features including the Build Mapsite™ form, admin build-request management, CRM, associate portal, production queue kanban, email notifications, and the Mapsite™ public renderer — is **fully coded but the database migrations have not yet been applied to the live Supabase project**. Once the migrations are deployed and environment variables validated, these features will become operational.

**Eight database migration files** (numbered 027 through 034) need to be applied. They create six new tables (`build_requests`, `fast_codes`, `mapsite_requests`, `mapsite_assets`, `production_queue`, `activity_logs`) and one storage bucket (`mapsite-assets`).

---

## Deployed Pages

The platform has **67 active routes**. This section lists every route with its status.

### Public Website

| Page | URL | Purpose | Status |
|---|---|---|---|
| Home | `/` | Main landing page with hero, stats, and product overview | Production Ready |
| Glasshouse Configurator | `/glasshouse` | Configure Glasshouse greenhouse models | Production Ready |
| Talishouse Residential | `/talishouse-residential` | Residential home configurator | Production Ready |
| Talishouse Recreational | `/talishouse-recreational` | Recreational cottage configurator | Production Ready |
| Talishouse | `/talishouse` | General Talishouse product page | Production Ready |
| TalisTowns | `/talistowns` | TalisTowns community product page | Production Ready |
| Catalog | `/catalog` | Full product catalog | Production Ready |
| Catalogue | `/catalogue` | Alternate product catalog page | Production Ready |
| Find Your Market | `/find-your-market` | Product matching questionnaire | Production Ready |
| Match Results | `/match-results` | Product recommendation results | Production Ready |
| Lease to Own | `/lease-to-own` | Financing information page | Production Ready |
| Dealers | `/dealers` | Dealer / partner information | Production Ready |
| Propose Project | `/propose-project` | Submit a project proposal | Production Ready |
| Project Received | `/project-received` | Confirmation after project submission | Production Ready |
| Add Project | `/add-project` | Add a new project | Production Ready |
| Privacy Policy | `/privacy` | Privacy policy page | Production Ready |
| Terms of Service | `/terms` | Terms and conditions | Production Ready |
| Success | `/success` | Generic success confirmation | Production Ready |
| Subscription | `/subscription` | Subscription / signup page | Production Ready |
| Checkout | `/checkout` | Shopping cart checkout | Production Ready |

### Partner & FAST Code System

| Page | URL | Purpose | Status |
|---|---|---|---|
| FAST Code Generator | `/fast-code` | Generate a FAST Code for partner access | Production Ready — iframe embeddable |
| Partner Access | `/partner-access` | Access Mapsites™ using FAST Codes | Production Ready — iframe embeddable |
| TTV Access (redirect) | `/ttvaccess/[fastCode]` | Redirect route for FAST Code access | Production Ready (legacy) |
| Mapsite™ Viewer | `/ma/[fastcode]` | Public Mapsite™ page showing all assets | Functional — needs live data |
| Partner View | `/partner-view` | Partner dashboard view | Stub / Incomplete |

### Build System

| Page | URL | Purpose | Status |
|---|---|---|---|
| Build a Mapsite™ | `/build-mapsite` | 8-section form to request a Mapsite™ build | Built — needs migration deploy |
| Mapsite™ Page | `/mapsite` | General Mapsite™ listing | Stub / Incomplete |
| Mapsite™ by Slug | `/mapsite/[slug]` | Mapsite™ by custom slug | Stub / Incomplete |

### Associate Portal

| Page | URL | Purpose | Status |
|---|---|---|---|
| Associate Login | `/associate/login` | Login via FAST Code | Built — needs migration deploy |
| Associate Dashboard | `/associate/dashboard` | 3-tab view of assigned requests | Built — needs migration deploy |
| Associate Public Page | `/associate/[fastCode]` | Public white-labeled associate page with contact form | Production Ready |
| Associate Status | `/associate-status` | Associate status check | Production Ready |

### Business Office

| Page | URL | Purpose | Status |
|---|---|---|---|
| Business Office | `/business-office` | Partner hub — lease-to-own, e-commerce, partner programs | Production Ready |
| Business Office Apply | `/business-office/apply` | Apply for business programs | Production Ready |
| Business Office Propose | `/business-office/propose-project` | Propose a project via business office | Production Ready |
| Business Office Register | `/business-office/register` | Register as a partner | Production Ready |
| Business Office Transactions | `/business-office/transactions` | View transaction history | Production Ready |

### Admin Console (needs database deployment)

| Page | URL | Purpose | Status |
|---|---|---|---|
| Admin Login | `/admin/login` | Login with ADMIN123 code | Production Ready |
| Admin Dashboard | `/admin/dashboard` | Overview stats (deals, earnings) | Production Ready |
| Admin Leads | `/admin/leads` | Lead management with deal creation | Production Ready |
| Admin Build Requests | `/admin/build-requests` | Table view with search/sort/pagination/assign/complete | Needs migration deploy |
| Admin Production Queue | `/admin/production-queue` | 5-column kanban with drag-and-drop | Needs migration deploy |
| Admin Associates | `/admin/associates` | Associate list and creation | Production Ready |
| Admin Associate Settings | `/admin/associates/[id]` | Per-associate settings editor | Production Ready |
| Admin Applications | `/admin/applications` | Associate applications (approve/reject) | Production Ready |
| Admin Project Applications | `/admin/project-applications` | Project applications (approve/reject) | Production Ready |
| Admin Content | `/admin/content` | Edit GlobalContent CMS blocks | Production Ready |
| Admin Deals | `/admin/deals` | Deal management with edit modal | Production Ready |
| Admin FAST Codes | `/admin/fast-codes` | FAST code CRUD | Production Ready |
| Admin Leads Simulation | `/admin/leads-simulation` | CSV import and sample lead generation | Production Ready |
| Admin Payments | `/admin/payments` | Payment transaction viewer | Production Ready |
| Admin Pricing | `/admin/pricing` | Full pricing configuration (tax, payment options, discounts) | Production Ready |
| Admin Products | `/admin/products` | Product price editor | Production Ready |
| Admin Projects | `/admin/projects` | Project management | Production Ready |
| Admin TalisBOT | `/admin/talisbot` | TalisBOT analytics dashboard | Production Ready |
| Admin Users | `/admin/users` | User management | Production Ready |
| Admin User Profile | `/admin/users/[id]` | Per-user detail with stats and leads | Production Ready |

### CRM (needs database deployment)

| Page | URL | Purpose | Status |
|---|---|---|---|
| CRM Login | `/crm/login` | Login with role codes (ADMIN/MANAGER/ASSOCIATE) | Needs migration deploy |
| CRM Dashboard | `/crm` | Metric cards and quick links | Needs migration deploy |
| CRM Leads | `/crm/leads` | Read-only lead viewer | Needs migration deploy |
| CRM Build Requests | `/crm/build-requests` | Read-only build request list | Needs migration deploy |
| CRM Mapsites™ | `/crm/mapsites` | Read-only Mapsite™ list | Needs migration deploy |
| CRM Associates | `/crm/associates` | Read-only associate list | Needs migration deploy |
| CRM Production Queue | `/crm/production-queue` | Read-only queue viewer with status filter | Needs migration deploy |
| CRM Activity Logs | `/crm/activity-logs` | Audit trail viewer with table filter | Needs migration deploy |

---

## FAST Code System

### What Are FAST Codes?

FAST Codes are **4-character alphanumeric codes** (e.g., `LRG1`, `TTV7`, `ABC2`) that serve as unique identifiers for partners, associates, and Mapsites™. They are the central key linking:

- A **client or partner** to their Mapsite™
- A **build request** to its production status
- An **associate** to their dashboard and commission records

FAST Codes use the character set `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789` (uppercase letters and digits only — no lowercase, no special characters). The format was recently changed from an older name-based format (`{initials}{number}-ttv`) to the current random 4-character format.

### How They Are Generated

The `generateFastCode()` function works as follows:

1. It receives a list of all existing FAST Codes from the database.
2. It randomly selects 4 characters from the 36-character set (A-Z, 0-9).
3. It checks that the generated code is not already in use.
4. If it collides with an existing code, it retries with a new random code.
5. It can retry up to **200 times** before failing (at which point all 1,679,616 possible codes would be nearly exhausted — extremely unlikely).

### How Users Access Mapsites™

1. A partner receives their FAST Code (either generated via the FAST Code Generator form or as a result of submitting a Mapsite™ build request).
2. The partner visits **`https://talispros.com/partner-access`** and enters their FAST Code.
3. The system opens the corresponding Mapsite™ at **`https://talispros.com/ma/{fastCode}`**.
4. The Mapsite™ page displays the client's profile image, logo, pin image, description, media type, PDF links, and contact information.

### Current Workflow

**Two parallel FAST Code systems exist:**

1. **Legacy Flow** (`/fast-code` + `fast_code_registrations` table):
   - A partner fills out the standalone FAST Code Generator form.
   - The code is registered in the `fast_code_registrations` table.
   - The partner is redirected to the Business Office for registration/subscription.

2. **Build System Flow** (`/build-mapsite` + `fast_codes` table):
   - A client submits a full Mapsite™ build request (8 sections of data, file uploads).
   - A FAST Code is generated and linked to their `build_requests` record.
   - The code is stored in the `fast_codes` table with `type: "mapsite"`.

### Known Limitations

- **Two independent tables** — FAST Codes in `fast_code_registrations` are **not cross-checked** against `fast_codes`. The same code could theoretically exist in both tables (though extremely unlikely with 4-character randomness).
- **No transaction rollback** — The build submission action writes to 6 tables sequentially. If one fails, earlier writes are not rolled back, which could create orphan records.
- **No RLS between systems** — The Mapsite™ engine uses the service-role key and bypasses row-level security. This is fine for public pages but means audit logging is the only protection.

---

## Partner Access Page

| Field | Details |
|---|---|
| **URL** | `https://talispros.com/partner-access` |
| **Purpose** | Allow wholesale partners to access their dedicated Mapsites™ using FAST Codes |
| **Layout** | Embeddable — no site chrome (header, footer, chat), white background, flat styling |
| **SEO** | Dedicated metadata with OG image (`/seo/partner-access-og.png`), canonical URL, Twitter card |

### Fields

- **FAST Code** — text input, auto-accepts lower/upper case, validates against `/^[a-z0-9-]+$/`

### Submission Process

1. Partner enters their FAST Code (or pastes a full URL — trailing slashes and domain prefixes are stripped).
2. Validation checks for non-empty and alphanumeric format.
3. On submit, the Mapsite™ opens in a **new browser tab** at `https://talispros.com/ma/{fastCode}`.
4. The input field resets and refocuses for the next user.
5. The loading state resets correctly after submission.

### iframe Compatibility

The page is designed to be embedded in partner websites via iframe. To support this:

- **Header and Footer are stripped** — the page renders in isolation via `RootShell.tsx` (checks `pathname.startsWith("/partner-access")`).
- **White background** is enforced via inline styles on `<body>` and the page wrapper.
- **No TalisBot chat widget** appears on this page.
- **Flat, compact form styling** — no card shadows, no rounded containers, minimal visual weight.
- **Min-height overrides** — the page sets `document.body.style.minHeight = "auto"` and `document.documentElement.style.height = "auto"` to avoid grey space in embedded iframes.

### Recent Fixes Applied

- Loading state reset after submission (was stuck in "loading" state)
- Changed "Access Mapsite™" button behavior to open in new tab
- Windswept logo replaced old branding
- Mobile responsiveness improved (padding, font sizes, image sizing)
- Grey background below embedded forms fixed (body min-height override)

---

## FAST Code Generator

| Field | Details |
|---|---|
| **URL** | `https://talispros.com/fast-code` |
| **Purpose** | Generate a FAST Code for partner portal access |
| **Layout** | Embeddable — no site chrome, flat design, white background |
| **Phases** | Form → Success (shows code) → Error |

### Fields Collected

| Field | Type | Validation |
|---|---|---|
| First Name | Text (single line) | Required, must be non-empty |
| Last Name | Text (single line) | Required, must be non-empty |
| Email | Email | Required, must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| Cell Phone | Tel | Required, must be non-empty |
| Street Address | Text (single line) | Required, must be non-empty |
| State / Province | Dropdown | Required, must be selected |

The Province/State dropdown contains **13 Canadian provinces/territories** and **50 US states**, making the form usable for both Canadian and American partners.

### Validation Rules

All validation happens on **both the client side** (before form submission) and **server side** (in the `registerFastCode` server action). If validation fails, an error message is displayed under the submit button. The form does not show per-field error states — all errors appear as a single message below the form.

### On Success

The user sees their FAST Code displayed in large text with a **copy-to-clipboard** button and a **"Continue to Registration"** button that navigates to the Business Office.

---

## Registration Flow

The complete user journey from FAST Code generation to Mapsite™ production:

```
Step 1: Generate FAST Code
        URL: https://talispros.com/fast-code
        Partner fills in: First Name, Last Name, Email, Phone, Address, Province
        → System generates unique 4-character FAST Code
            ↓

Step 2: Receive Code
        URL: https://talispros.com/fast-code (success state)
        FAST Code displayed with copy button
        Partner copies code or clicks "Continue to Registration"
            ↓

Step 3: Redirect to Registration
        URL: https://talispros.com/business-office/register
        Partner registers with their FAST Code
        (iframe breakout: window.top.location.href redirects parent window)
            ↓

Step 4: Subscription Selection
        URL: https://talispros.com/subscription
        Partner selects subscription tier
        PayPal checkout integration
            ↓

Step 5: Mapsite™ Production
        URL: https://talispros.com/build-mapsite
        Partner submits full build request with:
          - Personal information
          - Account type selection
          - Media focus areas (up to 6 checkboxes)
          - Mapsite™ asset uploads (profile image, logo, pin image, PDFs)
          - Design preferences
          - Additional comments
        → System creates: build_request, fast_code, mapsite_request,
          mapsite_assets, production_queue entry, activity_log entry
        → Email sent: Build Request Received + FAST Code Generated
```

---

## Recent Fixes Completed

### Changelog (Chronological — Most Recent First)

| Date | Commit | Description | Affected Pages |
|---|---|---|---|
| Jun 11 | `2897cc6` | Fix grey background below embedded forms — override body min-height and grey bg for embed pages | `/partner-access`, `/fast-code` |
| Jun 11 | `492a640` | Fix partner-access embed layout — strip Header/Footer, equalize vertical padding | `/partner-access` |
| Jun 11 | `ff452fa` | Set white background on fast-code and partner-access pages for clean iframe embedding | `/partner-access`, `/fast-code` |
| Jun 11 | `a2062c6` | Strip card styling from form inputs, selects, and wrapper containers | `/partner-access`, `/fast-code` |
| Jun 11 | `5d23f9a` | Phase 1 UI simplification — compact iframe-friendly forms | `/partner-access`, `/fast-code` |
| ~Jun 1 | `ea1b609` | Remove "Already have a Fast Code?" and "Access Mapsite™" links from fast-code page | `/fast-code` |
| ~Jun 1 | `a62b36f` | Fix: use `window.top.location.href` for reliable iframe breakout on fast-code redirect | `/fast-code` |
| ~Jun 1 | `14511ae` | Fix: break out of iframe on fast-code redirect to register page | `/fast-code` |
| ~Jun 1 | `bd67d74` | Phase 1 stabilization — onboarding flow and iframe navigation fixes | `/fast-code`, `/partner-access` |
| ~May 28 | `3f97149` | Add State/Province field to Fast Code generator for US/CA support | `/fast-code` |
| ~May 28 | `cb59a78` | Fix: reset loading state after Fast Code submission | `/fast-code` |
| ~May 25 | `a88ec64` | Fix: guard `window.top` null check for TypeScript build | `/fast-code` |
| ~May 25 | `a1a0515` | Add partner-access CTA and replace spark icon with Windswept logo | `/fast-code` |
| ~May 22 | `1b819a1` | Fast Code generator, domain update, TalisBot suppression, Mapsite™ text | `/fast-code` |
| ~May 20 | `06208b8` | Simplify partner-access page for Phase ONE operational rollout | `/partner-access` |
| ~May 18 | `a11702f` | Add (TM) to partner-access metadata title/description | `/partner-access` |
| ~May 18 | `76648b2` | Update partner-access metadata for brand consistency | `/partner-access` |
| ~May 15 | `db39ea0` | Fix partner-access metadata, OG image, and metadataBase for crawlers | `/partner-access` |
| ~May 15 | `b6f6316` | Update SEO metadata for partner-access page | `/partner-access` |
| ~May 12 | `f872b30` | Update marquee brand names on partner-access page | `/partner-access` |
| ~May 12 | `924d522` | Update footer branding text on partner-access page | `/partner-access` |
| ~May 10 | `54471f2` | Add premium "How the Flow Works" and Workflow Overview sections | `/partner-access` |
| ~May 10 | `6d469e3` | Update partner-access page title and subheading | `/partner-access` |
| ~May 8 | `8360890` | Replace examples with "request fast code" CTA | `/partner-access` |
| ~May 8 | `66e9e80` | Complete premium refactor of partner-access portal | `/partner-access` |
| ~May 5 | `304bbe3` | Add `ttvaccess` route for fast code redirection | `/ttvaccess` |
| ~May 5 | `54813c7` | Simplify partner-access page, hide global header/footer | `/partner-access` |

### Styling & Onboarding Improvements

- Windswept logo implemented across the site (replaced old branding)
- Global layout centered at 1400px with 75px spacing
- Footer restructuring with updated brand text
- Mobile home page with Apple-style kinetic benefits scroll
- Global 260px horizontal spacing on desktop
- PayNow button rebranding, clean card styling for edit listing

---

## Known Issues

### 1. Database Migrations Not Applied

**Description:** Eight migration files (027–034) that create the Build System tables have not been applied to the live Supabase project. All Build System, CRM, and associate dashboard features depend on these tables.

**Impact:** Any user visiting `/build-mapsite`, `/admin/build-requests`, `/admin/production-queue`, `/crm/*`, or `/associate/dashboard` will encounter database errors or see empty states. The entire TalisPros Build System is non-functional.

**Recommended Fix:** Run `supabase migration up` to apply migrations 027 through 034 to the Supabase project. Verify tables exist and storage bucket `mapsite-assets` is created.

### 2. Missing `SUPABASE_SERVICE_ROLE_KEY`

**Description:** The `.env` file contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` but **not** `SUPABASE_SERVICE_ROLE_KEY`. The Build System server actions (`submitBuildRequest`, `assignBuildRequest`, `completeBuildRequest`) use `supabaseAdmin` which requires this key to bypass RLS.

**Impact:** When the Build System is deployed, server actions that write to the database will fail because they lack service-role privileges. Currently they log an error and fall back to an unauthenticated Supabase client.

**Recommended Fix:** Add `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>` to `.env` and `.env.local`. The key can be obtained from the Supabase project dashboard under Settings → API → service_role key.

### 3. Hardcoded Admin Session Code (`ADMIN123`)

**Description:** The admin session system in `lib/fast-code.ts` uses a **hardcoded code** (`ADMIN123`) checked entirely in client-side JavaScript (localStorage + cookie). There is no server-side verification.

**Impact:** Anyone who knows or guesses `ADMIN123` can access the admin console. While this is acceptable for development, it is a security risk for production.

**Recommended Fix:** Replace the hardcoded code with a server-side authentication system (Supabase Auth with email/password or magic link, or a configurable environment variable `ADMIN_ACCESS_CODE` checked server-side).

### 4. .env File Committed to Repository

**Description:** The `.env` file containing `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, and `RESEND_API_KEY` is **committed to git** and visible in the repository history.

**Impact:** Anyone with access to the repository (or its history) has the Supabase anonymous key, PayPal client ID, and Resend API key. While the Supabase anon key is designed to be public, and the PayPal client ID is also public-facing, committing any credentials to a repository is a security anti-pattern.

**Recommended Fix:** Remove `.env` from git tracking. Use `.env.local` for local development and environment variables in Vercel for production. Consider rotating the committed API keys.

### 5. No Database Transactions

**Description:** The `submitBuildRequest` server action writes to 6 tables sequentially without wrapping in a database transaction. If a later insert fails, earlier writes remain committed.

**Impact:** Potential orphaned records — a `build_requests` row with no corresponding `mapsite_requests`, `production_queue`, or `fast_codes` row. This could lead to dashboard inconsistencies where build requests exist but cannot be processed.

**Recommended Fix:** Wrap the multi-table writes in a database transaction using Supabase RPC (a PostgreSQL function) or implement a compensating transaction pattern.

### 6. Two Parallel FAST Code Tables

**Description:** The legacy FAST Code flow uses `fast_code_registrations` while the Build System uses `fast_codes`. These are independent tables with no cross-table uniqueness check.

**Impact:** A FAST Code could theoretically be generated in one system while already existing in the other (extremely unlikely with 1.6M possible codes but possible).

**Recommended Fix:** Add a unified uniqueness check that queries both tables, or migrate the legacy system to use the new `fast_codes` table.

### 7. Fire-and-Forget Email Sends

**Description:** All email notifications use `.then()` without `await`, meaning the server action returns `success: true` before the email is confirmed sent.

**Impact:** If Resend is down or the email bounces, the user sees a success message but never receives their confirmation email. There is no retry logic.

**Recommended Fix:** Consider moving email sends to a background queue (e.g., Vercel Cron Jobs + queue table) so that failures can be retried.

### 8. Minimal Test Coverage

**Description:** Only one test file exists (`__tests__/fast-code-generator.test.ts` with 7 test cases). There are no tests for UI components, API routes, database operations, or email sending.

**Impact:** Code changes carry regression risk. There is no automated safety net for the checkout flow, the Build System, or the CRM.

**Recommended Fix:** Add integration tests for critical paths (FAST Code generation, build submission, email notifications) and component tests for key UI interactions.

### 9. Next.js 16 Breaking Changes

**Description:** The `AGENTS.md` file warns that this version of Next.js (16.2.1) has breaking changes from standard Next.js patterns.

**Impact:** Standard Next.js tutorials and documentation may suggest deprecated or incorrect patterns. Developers unfamiliar with Next.js 16 could introduce bugs by following out-of-date guidance.

**Recommended Fix:** Maintain a local reference guide (`node_modules/next/dist/docs/`) and ensure all developers read it before making changes.

---

## Administrative Features

### Proposal Center

The proposal center is accessed via the **Business Office** (`/business-office/propose-project`). Partners can:

- Submit project proposals with name, email, phone, location, and participation level
- Proposals are stored in the `applications` table
- Admin can approve/reject proposals from `/admin/project-applications`
- Approval generates a FAST Code and creates an associate record

### Proposal History

Proposal history is available in:

- **Admin Project Applications** (`/admin/project-applications`) — shows all submitted proposals with status (pending/approved/rejected), searchable by name.
- **Admin Applications** (`/admin/applications`) — shows associate applications specifically (name, role, location, preferred FAST Code, status).
- **Admin Deals** (`/admin/deals`) — shows deal history with stat cards (Total Value, New, Won, Lost) and edit capabilities.

### Deployment Log

No automated deployment log exists. Deployments are managed through Vercel's automatic deployment pipeline (git push → build → deploy). Deployment history can be viewed in the Vercel dashboard.

### PDF Generation

The Build System supports **PDF upload** as part of the Mapsite™ build request:

- **Monologue PDF** — uploaded as part of the build form at `/build-mapsite`
- **eBook PDF** — uploaded as part of the build form at `/build-mapsite`
- PDFs are stored in Supabase Storage bucket `mapsite-assets` (max 20 MB, `application/pdf` MIME type)
- PDFs are displayed as download links on the public Mapsite™ page at `/ma/[fastcode]`

There is **no server-side PDF generation** — PDFs are user-uploaded only.

### Dashboard Functions

Three dashboards exist:

1. **Admin Dashboard** (`/admin/dashboard`) — 4 stat cards: Total Deals, Active Deals, Closed Deals, Earnings (CAD formatted). Fetches from `deals` table.

2. **Associate Dashboard** (`/associate/dashboard`) — 3-tab view (Pending / In Progress / Completed) showing the associate's assigned Mapsite™ requests with client details and status badges. Includes a commission tracking placeholder.

3. **CRM Dashboard** (`/crm`) — 5 metric cards: New Requests, Assigned, Completed, Pipeline (Leads), Pending Queue. Includes a quick links grid to all CRM modules.

---

## Deployment History

### Recent Commits (Chronological)

| Date | Commit ID | Description | Affected Pages |
|---|---|---|---|
| Jun 11 | `2897cc6` | Fix grey background below embedded forms | `/partner-access`, `/fast-code` |
| Jun 11 | `492a640` | Fix partner-access embed layout | `/partner-access` |
| Jun 11 | `ff452fa` | White background for clean iframe embedding | `/partner-access`, `/fast-code` |
| Jun 11 | `a2062c6` | Strip card styling from forms | `/partner-access`, `/fast-code` |
| Jun 11 | `5d23f9a` | Phase 1 UI simplification | `/partner-access`, `/fast-code` |
| Jun 1 | `ea1b609` | Remove "Already have a Fast Code?" and "Access Mapsite™" links | `/fast-code` |
| Jun 1 | `a62b36f` | Use `window.top.location.href` for iframe breakout | `/fast-code` |
| Jun 1 | `14511ae` | Break out of iframe on redirect | `/fast-code` |
| Jun 1 | `bd67d74` | Phase 1 stabilization | `/fast-code`, `/partner-access` |
| May 28 | `3f97149` | State/Province field for US/CA support | `/fast-code` |
| May 28 | `cb59a78` | Reset loading state after submission | `/fast-code` |
| May 25 | `a88ec64` | Guard `window.top` null check | `/fast-code` |
| May 25 | `a1a0515` | Partner-access CTA + Windswept logo | `/fast-code` |
| May 22 | `1b819a1` | FAST Code generator + TalisBot suppression | `/fast-code` |
| May 20 | `06208b8` | Simplify partner-access for Phase ONE rollout | `/partner-access` |
| May 18 | `a11702f` | Add (TM) to metadata | `/partner-access` |
| May 15 | `db39ea0` | Fix OG image and metadataBase | `/partner-access` |
| May 12 | `f872b30` | Update marquee brand names | `/partner-access` |
| May 10 | `54471f2` | Premium "How the Flow Works" sections | `/partner-access` |
| May 8 | `66e9e80` | Premium refactor of partner-access | `/partner-access` |
| May 5 | `304bbe3` | Add `ttvaccess` route | `/ttvaccess` |
| Prior | Various | PayPal integration, business office, cart, mobile home, product configurators, branding | Various |

### Deployment Method

The site is deployed to **Vercel** via git push (Vercel automatically detects Next.js and deploys). There is no manual deployment process. A `VERCEL_OIDC_TOKEN` is configured for OIDC-based deployments.

---

## User Guide for Ralf

*This section is written for a non-technical audience.*

### How to Generate FAST Codes

1. Go to **https://talishouse.com/fast-code**
2. Fill out the form with the partner's information:
   - First Name, Last Name
   - Email Address
   - Cell Phone Number
   - Street Address
   - Province or State (select from dropdown)
3. Click the submit button.
4. A unique 4-character code will be displayed (e.g., `LRG1`, `TTV7`).
5. You can **copy the code** to your clipboard or click **"Continue to Registration"** to proceed.

### How to Access Mapsites™

1. Go to **https://talishouse.com/partner-access**
2. Enter the FAST Code. The code is not case-sensitive — `lrg1` works the same as `LRG1`.
3. Click **"Access Mapsite™"**.
4. The Mapsite™ will open in a new browser tab.

The Mapsite™ page shows:
- The client's profile image
- Their company logo
- A location pin image on a map
- A description of their business
- The media type (e.g., "standard")
- Links to PDF documents
- Contact card

### How to Review Registrations

1. Log in to the Admin console using the FAST Code **ADMIN123** at:
   **https://talishouse.com/admin/login**
2. Navigate to **"FAST Codes"** in the sidebar to see all generated codes.
3. To see detailed registrations, go to **"Associates"** in the sidebar.
4. You can search by name or FAST Code, and edit or delete records.

### How to Monitor Onboarding

Use the **Admin Dashboard** at `/admin/dashboard` to see high-level stats:

- **Total Deals** — how many active business arrangements
- **Active Deals** — deals currently in progress
- **Closed Deals** — completed deals
- **Earnings** — total across all deals (in CAD)

For per-partner details, navigate to:
- **"Leads"** — see incoming leads from the website, TalisBOT chatbot, and associate pages
- **"Applications"** — see associate sign-up applications (approve or reject)
- **"Project Applications"** — see project proposals (approve or reject)

### How to Share Mapsites™

1. Once a Mapsite™ is built, it has a public URL: **https://talishouse.com/ma/{FAST_CODE}**
2. Share this URL with the partner. For example, if the FAST Code is `LRG1`, share: **https://talishouse.com/ma/lrg1**
3. Partners can also access it via **https://talishouse.com/partner-access** by entering their code.
4. The Mapsite™ can be embedded in partner websites using an iframe.

### How to Verify New Submissions

1. Check the **"Leads"** page in the Admin console to see new form submissions (name, phone, source, date).
2. Check **"Build Requests"** to see Mapsite™ build submissions (once the Build System is deployed).
3. Check **"Project Applications"** for project proposals submitted via the Business Office.
4. Check **"Applications"** for new associate sign-ups.
5. The **TalisBOT Analytics** page shows chatbot lead capture statistics including conversion rate and budget distribution.

---

## Current Architecture

### Frontend

| Component | Technology |
|---|---|
| Framework | **Next.js 16.2.1** with App Router |
| UI Library | **React 19.2.4** |
| Styling | **Tailwind CSS v4** (CSS-based config, no tailwind.config.js) |
| Font | **Poppins** via next/font/google |
| Icons | **Lucide React** |
| Animations | **Framer Motion** |
| Drag & Drop | **@dnd-kit** (core + sortable + utilities) |
| Notifications | **react-hot-toast** |
| State Management | React Context (CartContext, AuthContext, AssociateContext) |

### Backend

| Component | Technology |
|---|---|
| Server Actions | Next.js Server Actions (`"use server"`) |
| API Routes | Next.js Route Handlers (`/app/api/*`) |
| Email | **Resend SDK** (`resend` npm package, v6.14.0) |
| Commissions | Custom split calculator (`lib/splits.ts`) |

### Database

| Component | Technology |
|---|---|
| Database | **Supabase PostgreSQL** |
| Client | **@supabase/supabase-js** v2 |
| Tables | 24 tables (leads, users, deals, associates, fast_codes, build_requests, mapsite_requests, etc.) |
| Migrations | 36 SQL migration files |
| Row Security | RLS enabled on most tables; disabled on CMS tables |

### Storage

| Component | Technology |
|---|---|
| File Storage | **Supabase Storage** |
| Bucket | `mapsite-assets` (public, 20 MB limit, image + PDF MIME types) |

### Authentication

| Component | Technology |
|---|---|
| Public Access | Supabase anon key (no session persistence) |
| Admin Access | **Hardcoded code ADMIN123** via localStorage + cookie |
| CRM Access | Role codes (ADMIN/MANAGER/ASSOCIATE) via localStorage |
| Associate Access | FAST Code lookup in `users` table |
| Supabase Auth | Session persistence **disabled** — not used for user auth |

### Hosting

| Component | Technology |
|---|---|
| Hosting Platform | **Vercel** |
| Domain | `talishouse.com` (primary), `talispros.com` (secondary for Mapsites™) |
| Environment | Node.js (version managed by Vercel) |
| Deployment | Automatic — git push triggers build + deploy |

---

## Recommended Next Phase

### Phase 1: Deployment + Workflow Stabilization

**Duration:** 1-2 weeks

**Tasks:**

1. **Apply database migrations** — Run `supabase migration up` to create all Build System tables and the storage bucket.
2. **Set environment variables** — Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and Vercel environment settings.
3. **End-to-end test** — Submit a complete build request from `/build-mapsite`, verify all 6 tables are populated, confirm email delivery.
4. **Test admin workflows** — Log in to admin, view build requests, assign to an associate, mark complete. Verify emails.
5. **Test associate dashboard** — Log in as an associate, view assigned requests, verify status display.
6. **Test CRM** — Log in with ADMIN/MANAGER/ASSOCIATE roles, verify permission gating works as expected.
7. **Address critical security issues** — Remove `.env` from git history, replace hardcoded `ADMIN123` with configurable env var.
8. **Add database transactions** — Wrap multi-table writes in a PostgreSQL function or Supabase RPC to prevent orphan records.

**Deliverables:**
- All Build System features operational in production
- Verified email delivery for all 4 notification types
- Security vulnerabilities closed (env in git, hardcoded admin code)
- Test scripts for common workflows

### Phase 2: Automated Mapsite™ Generation

**Duration:** 2-3 weeks

**Tasks:**

1. **Build the Mapsite™ Atlas renderer** — Replace the placeholder `/ma/[fastcode]` page with a full interactive geospatial map that renders profile images, logos, pin markers, descriptions, and media content on an embedded map canvas.
2. **Implement media processing** — Auto-resize uploaded images to standard dimensions for consistent Mapsite™ display. Generate thumbnails for faster loading.
3. **Add Mapsite™ customization options** — Allow associates to customize colors, layout, and branding on their Mapsite™ page.
4. **Implement PDF preview** — Render uploaded PDFs as embedded previews rather than just download links.
5. **Add QR code generation** — Generate a QR code for each Mapsite™ URL that partners can print on business cards/flyers.
6. **Build Mapsite™ analytics** — Track page views, link clicks, and contact form submissions per Mapsite™.

**Deliverables:**
- Fully rendered interactive Mapsite™ Atlas
- Image/media pipeline with automatic optimization
- Customization controls in admin/associate settings
- QR code for every Mapsite™
- Basic analytics dashboard per Mapsite™

### Phase 3: Atlist Map Provider Replacement

**Duration:** 2-3 weeks

**Tasks:**

1. **Audit current Atlist integration** — Identify all locations where Atlist map embeds are used (associate pages, Mapsite™ pages).
2. **Evaluate alternatives** — Research and select a replacement map provider (Google Maps, Mapbox, Leaflet with OpenStreetMap, or another provider) based on feature needs, pricing, and licensing.
3. **Implement new map provider** — Replace Atlist embeds with the new provider's maps, maintaining or improving visual design.
4. **Migrate existing map data** — Port any custom map styling, markers, pins, and overlays from Atlist to the new provider.
5. **Test all map locations** — Verify that maps render correctly on associate pages, Mapsite™ pages, and any other embedded locations.
6. **Update documentation** — Document the new map provider API key requirements and usage for future development.

**Deliverables:**
- Atlist dependency fully removed
- New map provider integrated across all pages
- All existing map features preserved or improved
- API key management documented

### Phase 4: Associate and Commission Platform

**Duration:** 3-4 weeks

**Tasks:**

1. **Complete commission tracking** — Build out the commission placeholder on the associate dashboard with real calculations from the `splits.ts` engine (20% of MSRP + 80% of addons). Show earned, pending, and paid commissions.
2. **Add payout system** — Implement a payout request/approval flow. Associates can request payouts, admins can approve and mark as paid. Integrate with PayPal for automatic disbursement.
3. **Build associate referral tracking** — Allow associates to generate referral links and track which leads came from their referrals. Attribute commissions to the correct associate.
4. **Add tiered commission rates** — Implement configurable commission tiers (e.g., 20% for new associates, 25% after 10 deals, 30% for top performers). Admin-configurable in the admin panel.
5. **Build performance reporting** — Create monthly/quarterly performance reports for associates (leads generated, deals closed, commissions earned, conversion rates). Exportable as CSV/PDF.
6. **Add two-factor authentication** — Replace the simple FAST Code login with proper authentication (Supabase Auth magic link or SMS code) for associate accounts.
7. **Expand the CRM** — Add commission reports, payout history, and performance dashboards to the CRM for manager and admin roles.

**Deliverables:**
- Full commission lifecycle (earn → request → approve → pay)
- Associate referral link system with attribution
- Tiered commission rate configuration
- Performance reporting with CSV export
- Production-grade authentication for associates
- CRM expanded with financial reporting

---

*End of Report*
