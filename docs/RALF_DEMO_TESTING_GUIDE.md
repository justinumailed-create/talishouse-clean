# Talispros™ Demo Testing Guide

**Prepared for:** Ralf Meyer  
**Audience:** Acceptance / user-journey testing  
**Scope:** Current implementation only (as inspected in the codebase)  
**Date:** 26 July 2026  

---

This guide walks through the live product as a user. It does not describe backend architecture in Parts 1–10. A separate **Developer Appendix** (Part 11) is included for Arun and Rahul only.

**Demo entry point:** `/talispros/start`

---

# Part 1 — System Overview

## What Talispros™ is

Talispros™ is the professional platform for real estate brokers, agents, For-Sale-By-Owner (FSBO) sellers, builders, and Adpro service partners. From Start, a user chooses who they are, opens a Mapsite™ on a map, claims a market, registers, pays when required, and builds marketing assets such as Talisbooks™ E-Books.

## What Talismaps™ is

Talismaps™ is the map experience behind Mapsites™ and related map tools. On the Mapsite™ screen, the map shows market pins and property flags. Separate Talismaps™ dashboard and editor pages exist for map management (some areas still show “coming soon”).

## What a Mapsite™ is

A Mapsite™ is a fullscreen map landing page for a market or listing. It shows a property pin/flag, listing media, and (when available) resource buttons such as MLS®, Broker URL, TEB™ (E-Book shelf), and TTV™. Unclaimed Mapsites™ invite “Claim a Market.” Claimed Mapsites™ move into registration, payment, and owner tools.

## What a Published Site is

In practice today, a “published” Mapsite™ is an **active** Mapsite™ with a FAST Code that can be opened at a stable public URL (for example `/talispros/mapsite/{accountType}/{fastCode}` or the legacy `/ma/{fastCode}` path). Marketing Admin can also mark a build request status as **Published**. There is no separate `/admin/published-sites` page in the current app.

## What Marketing Admin is

Marketing Admin is the internal console used by the marketing team (for example Rahul) to review build / claim requests, assign FAST Codes, generate draft Mapsites™, configure resource links, manage E-Books, send registration links, and activate Mapsites™. Primary path: `/talispros/marketing/admin` (login at `/talispros/marketing/login`).

## What FAST Codes are

A FAST Code is a short access code that identifies an account or Mapsite™ (examples seeded in data: `LRG1` / `lrg1`, `DEMO`). Users and admins use FAST Codes to open Mapsites™, sign into client analytics, manage admin Mapsite™ editors, and share TEB™ library shelves.

## What Root Accounts are

A Root Account™ is the primary market-owner account type. Registration plans describe Root as market ownership with Derivative capacity, SPLITS eligibility, Claim a Market eligibility, and FAST Code generation. Pricing plans include a full Root Account and a low-cost Root Account™ ($1) activation option used in demos.

## What Derivative Accounts are

A Derivative Account™ sits under a Root Account™. Plans describe multi-PIN support, operation under a Root, SPLITS, and FAST Code generation. Derivative accounts are selected during registration via account category / plan parameters.

## What AdPro PINs are

An Adpro PIN is a service-provider placement under the Adpro path. Plans include Single Adpro PIN and larger PIN packs. On Start, “I am an Adpro Service Provider” opens Mapsite™ with the Adpro audience. After activation, Adpro book entitlements allow one E-Book per PIN / Mapsite™ shelf.

---

# Part 2 — Required URLs

Routes below were read from the App Router (`app/**/page.tsx`) and `next.config.ts` redirects. Do not invent URLs that are not listed.

**Redirects currently configured**

| From | To |
|------|----|
| `/client/*` | `/talispros/client/*` |
| `/marketing/*` | `/talispros/marketing/*` |

---

## A. Primary demo journey (use these first)

| Route | Purpose | Who | Expected result |
|-------|---------|-----|-----------------|
| `/talispros/start` | Segment chooser (“What best describes you?”) | New prospects | Four audience cards; each opens Mapsite™ with an audience query |
| `/talispros/mapsite` | Fullscreen Mapsite™ map | Prospects / owners | Demo or loaded Mapsite™ on the map; pin/flag interaction |
| `/talispros/mapsite/[accountType]/[fastCode]` | Claimed / coded Mapsite™ | Owners / testers | Mapsite™ for that FAST Code and account type segment |
| `/talispros/markets/claim-a-market` | Claim a Market registration | Prospect claiming DEMO or a pin | Claim form; on success returns to Mapsite™ with `startHere=1` |
| `/talispros/markets/for-sale-by-owners` | FSBO market landing | FSBO audience | Market page content for FSBO |
| `/talispros/markets/real-estate-professionals` | Pro market landing | Agents / pros | Market page content for professionals |
| `/talispros/markets/talishouse-builders` | Builders market landing | Builders | Market page content for Talishouse builders |
| `/talispros/claim-a-market` | Alternate claim entry | Prospects | Claim flow entry (alongside markets path) |
| `/talispros/build-mapsite` | Build a Mapsite™ form | Applicants | Multi-section build request submission |
| `/talispros/register` | Account registration | New accounts | Root / Derivative / Adpro registration UI |
| `/talispros/ebook-choice` | Choose E-Book path | Mapsite™ owners after Start Here | Two options: generate own, or have Rahul build |
| `/talispros/ebook-generate` | Self-serve E-Book generation | Owners | Draft generation flow (no payment on this step) |
| `/talispros/ebook-rahul` | Rahul-assisted upload | Owners | Asset upload for marketing to build the book |
| `/talisbooks/viewer` | Sample soft-cover E-Book | Anyone | Demo FSBO sample magazine viewer |
| `/talisbooks/viewer/[slug]` | Named book viewer | Anyone with slug | Opens that book (e.g. `sample-ebook`) |
| `/talisbooks/library` | TEB™ bookshelf | Owners / visitors with FAST Code | Shelf of books; supports `?fastCode=` |
| `/talispros/marketing/login` | Marketing Admin sign-in | Marketing managers | Email + password form (Supabase) |
| `/talispros/marketing/admin` | Build-request queue | Marketing managers | Pending requests; approve / assign / generate actions |
| `/talispros/marketing/admin/[id]` | Request detail | Marketing managers | Full request workflow, resources, payment link tools |
| `/talispros/admin/login` | Talispros admin sign-in | Admins / PMC | Email + password (Supabase) |
| `/talispros/admin` | Talispros admin home | Admins | Links into PMC / forms / mapsites tools |
| `/talispros/admin/mapsites/[fastCode]` | Mapsite™ admin editor | Admins | Edit Mapsite™, share links, E-Book panel, resources |
| `/talispros/admin/pmc` | PMC browse | Admins | Admin map / PMC tools |
| `/talispros/client/login` | Client analytics login | Mapsite™ owners | Email + FAST Code (no password) |
| `/talispros/client/dashboard` | Client marketing dashboard | Authenticated clients | Client metrics / reports view |
| `/ma/[fastcode]` | Legacy public Mapsite™ | Public / partners | Mapsite™ rendered by FAST Code |

---

## B. Start & welcome

| Route | Purpose | Who | Expected result |
|-------|---------|-----|-----------------|
| `/talispros` | Talispros entry | Public | Product entry / navigation into Start |
| `/talispros/welcome` | Welcome | Public | Welcome content |
| `/talispros/start/fsbo` | FSBO start variant | FSBO | Start path for FSBO |
| `/talispros/start/developer` | Developer start variant | Developers | Start path for developer segment |
| `/talispros/start/investor` | Investor start variant | Investors | Start path for investor segment |

---

## C. Registration, payment & forms

| Route | Purpose | Who | Expected result |
|-------|---------|-----|-----------------|
| `/register` | Legacy registration + PayPal | Public | Registration with PayPal buttons |
| `/register/success` | Registration success | Registrants | Success confirmation |
| `/registration-success` | Alternate success | Registrants | Success confirmation |
| `/register-mapsite` | Mapsite™ registration + PayPal | Public | PayPal-enabled Mapsite™ registration |
| `/build-mapsite` | Legacy build form | Applicants | Older build-a-Mapsite™ form |
| `/subscription` | Subscription / PayPal vault UI | Public | PayPal subscription buttons |
| `/checkout` | Checkout | Public | Checkout page |
| `/success` | Generic success | Public | Confirmation |
| `/talispros/forms` | Forms product page | Public | TalisForms marketing / features |

---

## D. Marketing & admin (legacy `/admin` + CRM)

| Route | Purpose | Who | Expected result |
|-------|---------|-----|-----------------|
| `/admin/login` | Platform admin via FAST Code | Super admin | Accepts hardcoded admin FAST Code `ADMIN123` |
| `/admin` | Admin root | Admins | Admin landing |
| `/admin/dashboard` | Admin dashboard | Admins | Dashboard after login |
| `/admin/build-requests` | Build requests | Admins | Request list |
| `/admin/marketing` | Marketing queue (legacy) | Marketing | Assign FAST Code / generate Mapsite™ actions |
| `/admin/marketing/[id]` | Marketing request detail | Marketing | Request detail |
| `/admin/mapsites/[fastCode]` | Admin Mapsite™ by code | Admins | Mapsite™ admin editor |
| `/admin/fast-codes` | FAST Code management | Admins | Codes list / tools |
| `/admin/registrations` | Registrations & PayPal IDs | Admins | Registration records |
| `/admin/payments` | Payments | Admins | Payment records |
| `/admin/forms-manager` | Forms manager | Admins | Build submissions / checkouts |
| `/admin/production-queue` | Production kanban | Admins | Queue board |
| `/admin/talisbooks` | Talisbooks™ admin | Admins | Books admin |
| `/admin/talisbooks/centerfolds` | Centerfolds admin | Admins | Centerfold tools |
| `/admin/talismaps` | Talismaps™ admin | Admins | Maps admin |
| `/admin/users` | Users | Admins | User list |
| `/admin/users/[id]` | User detail | Admins | User detail |
| `/admin/leads` | Leads | Admins | Leads list |
| `/admin/leads-simulation` | Leads simulation | Admins | Simulated lead tools |
| `/admin/applications` | Applications | Admins | Application list |
| `/admin/project-applications` | Project applications | Admins | Project applications |
| `/admin/projects` | Projects | Admins | Projects list |
| `/admin/products` | Products | Admins | Products admin |
| `/admin/pricing` | Pricing | Admins | Pricing admin |
| `/admin/content` | Content | Admins | Content admin |
| `/admin/deals` | Deals | Admins | Deals admin |
| `/admin/associates` | Associates | Admins | Associates list |
| `/admin/associates/[id]` | Associate detail | Admins | Associate detail |
| `/admin/talisbot` | TalisBot admin | Admins | Bot admin |
| `/crm/login` | CRM login | CRM staff | Demo codes ADMIN / MANAGER / ASSOCIATE |
| `/crm` | CRM home | CRM staff | CRM landing |
| `/crm/leads` | CRM leads | CRM staff | Leads |
| `/crm/associates` | CRM associates | CRM staff | Associates |
| `/crm/build-requests` | CRM build requests | CRM staff | Build requests |
| `/crm/mapsites` | CRM Mapsites™ | CRM staff | Mapsites™ |
| `/crm/production-queue` | CRM production | CRM staff | Queue |
| `/crm/activity-logs` | Activity logs | CRM staff | Logs |
| `/talispros/admin/build-requests` | Talispros build requests | Admins | Build requests |
| `/talispros/admin/fast-codes` | Talispros FAST Codes | Admins | Codes |
| `/talispros/admin/forms-manager` | Talispros forms manager | Admins | Forms / checkouts |
| `/talispros/admin/pricing` | Talispros pricing | Admins | Pricing |
| `/talispros/admin/production-queue` | Talispros production | Admins | Queue |
| `/talispros/admin/registrations` | Talispros registrations | Admins | Registrations |
| `/talispros/marketing` | Marketing home | Marketing | Marketing landing |
| `/talispros/marketing/clients/[fastCode]` | Client marketing view | Marketing | Client by FAST Code |
| `/talispros/marketing/unauthorized` | Unauthorized | Blocked users | Access denied |
| `/talispros/mapsites/[fastCode]` | Mapsite™ by code | Users | Mapsite™ view |
| `/talispros/mapsites/[fastCode]/edit` | Edit Mapsite™ | Owners / admins | Edit UI |
| `/talispros/client/books` | Client books portal | Clients | Scaffold — editing not enabled yet |

---

## E. Talisbooks™ & Talismaps™

| Route | Purpose | Who | Expected result |
|-------|---------|-----|-----------------|
| `/talisbooks` | Talisbooks™ home | Public | Product entry |
| `/talisbooks/dashboard` | Books dashboard | Authors / staff | Overview (architecture scaffold messaging) |
| `/talisbooks/dashboard/books` | Books list | Authors / staff | Books |
| `/talisbooks/dashboard/templates` | Templates | Authors / staff | Templates |
| `/talisbooks/dashboard/layouts` | Layouts | Authors / staff | “Layouts coming soon” |
| `/talisbooks/dashboard/images` | Images | Authors / staff | “Image library coming soon” |
| `/talisbooks/dashboard/pages` | Pages | Authors / staff | “Pages coming soon” |
| `/talisbooks/dashboard/authors` | Authors | Authors / staff | “Authors coming soon” |
| `/talisbooks/dashboard/settings` | Settings | Authors / staff | “Settings coming soon” |
| `/talisbooks/editor` | Book editor | Authors / staff | Editor |
| `/talisbooks/settings` | Settings | Authors / staff | “Settings coming soon” |
| `/talismaps` | Talismaps™ home | Public | Maps entry |
| `/talismaps/dashboard` | Maps dashboard | Map owners | Dashboard |
| `/talismaps/dashboard/maps` | Maps list | Map owners | Maps |
| `/talismaps/dashboard/pins` | Pins | Map owners | Pins |
| `/talismaps/dashboard/templates` | Templates | Map owners | Templates |
| `/talismaps/dashboard/themes` | Themes | Map owners | “Theme editor coming soon” |
| `/talismaps/dashboard/media` | Media | Map owners | “Media library coming soon” |
| `/talismaps/dashboard/imports` | Imports | Map owners | “Import tools coming soon” |
| `/talismaps/dashboard/analytics` | Analytics | Map owners | “Analytics dashboard coming soon” |
| `/talismaps/dashboard/settings` | Settings | Map owners | Settings |
| `/talismaps/editor` | Map editor | Map owners | Editor |
| `/talismaps/settings` | Settings | Map owners | Settings |

---

## F. Partner, FAST Code & associate

| Route | Purpose | Who | Expected result |
|-------|---------|-----|-----------------|
| `/fast-code` | FAST Code generator | Partners | Generate a FAST Code (iframe-friendly) |
| `/partner-access` | Partner access by code | Partners | Access Mapsites™ with a code |
| `/partner-view` | Partner project view | Partners | Map embed + project interest form |
| `/ttvaccess/[fastCode]` | TTV access redirect | Public | FAST Code access redirect |
| `/a/[fastCode]` | Short associate / access path | Public | FAST Code route |
| `/associate/login` | Associate login | Associates | Login |
| `/associate/dashboard` | Associate dashboard | Associates | Dashboard |
| `/associate/[fastCode]` | Associate by code | Public | Associate page |
| `/associate-status` | Associate status | Associates | Status page |

---

## G. Consumer / product site

| Route | Purpose | Who | Expected result |
|-------|---------|-----|-----------------|
| `/` | Home | Public | Main marketing site |
| `/glasshouse` | Glasshouse configurator | Public | Product configurator |
| `/talishouse` | Talishouse | Public | Product page |
| `/talishouse-residential` | Residential | Public | Residential configurator |
| `/talishouse-recreational` | Recreational | Public | Recreational configurator |
| `/talistowns` | TalisTowns | Public | Community product |
| `/talistv` | TalisTV | Public | TTV destination (default TTV button target) |
| `/catalog` / `/catalogue` | Catalog | Public | Product catalog |
| `/find-your-market` | Matching questionnaire | Public | Market finder |
| `/match-results` | Match results | Public | Recommendations |
| `/lease-to-own` | Financing | Public | Lease-to-own info |
| `/dealers` | Dealers | Public | Dealer info |
| `/propose-project` | Propose project | Public | Proposal form |
| `/project-received` | Proposal confirmation | Public | Confirmation |
| `/add-project` | Add project | Public | Add project |
| `/products/talisforms` | TalisForms product | Public | Forms product |
| `/privacy` / `/terms` | Legal | Public | Policies |
| `/mapsite` / `/mapsite/[slug]` | Alternate Mapsite™ paths | Public | Mapsite™ by slug |
| `/business-office` | Business office | Associates | Requires `auth` cookie (middleware) |
| `/business-office/apply` | Apply (public) | Applicants | Public apply (middleware bypass) |
| `/business-office/register` | Associate registration | Associates | Shows “Coming soon...” |
| `/business-office/propose-project` | Propose via BO | Associates | Propose project |
| `/business-office/transactions` | Transactions | Associates | Transactions |

---

# Part 3 — Login Credentials

Passwords for Supabase-backed admin accounts are **not stored in this repository**. Ask Arun or Rahul for the live demo passwords, or check the deployment environment / password manager.

---

## 1. Marketing Admin (Rahul / marketing managers)

| Field | Value |
|-------|--------|
| Role | Marketing Manager |
| Login URL | `/talispros/marketing/login` |
| Email | Supabase Auth email for the marketing user (commonly Rahul’s address — **confirm with team**) |
| Username | Same as email |
| Password | **Not in repo** — configured in Supabase Auth |
| Allowlist | Environment variable `MARKETING_MANAGER_EMAILS` (comma-separated). If set, only listed emails may use Marketing Admin. |
| FAST Code | N/A (session is email-based) |
| Associated Mapsite™ | Operates on all queued build requests / Mapsites™ |
| Associated Published Site | N/A |

Also usable via redirected path `/marketing/login` → `/talispros/marketing/login`.

---

## 2. Talispros Admin / PMC Admin

| Field | Value |
|-------|--------|
| Role | Talispros Admin (also used for PMC / Mapsite™ admin tools) |
| Login URL | `/talispros/admin/login` |
| Email | Supabase Auth email |
| Password | **Not in repo** — configured in Supabase Auth |
| Expected configuration | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

---

## 3. Platform Super Admin (legacy `/admin`)

| Field | Value |
|-------|--------|
| Role | Platform admin |
| Login URL | `/admin/login` |
| Email / Username | N/A |
| Password | N/A |
| FAST Code | `ADMIN123` (hardcoded in `lib/admin-constants.ts`) |
| Expected result | Session cookie; redirect to `/admin/dashboard` |

---

## 4. CRM Demo Users

| Role | Access code | Login URL | Password |
|------|-------------|-----------|----------|
| Admin | `ADMIN` | `/crm/login` | None (code only) |
| Manager | `MANAGER` | `/crm/login` | None (code only) |
| Associate | `ASSOCIATE` | `/crm/login` | None (code only) |

Codes are displayed on the CRM login page as “Demo access codes.”

---

## 5. Client Analytics (Demo / seeded Mapsite™ owner)

| Field | Value |
|-------|--------|
| Role | Client (marketing analytics) |
| Login URL | `/talispros/client/login` |
| Email | `rahulc@talispros.com` (seeded against `lrg1` in migrations) |
| Username | Same as email |
| Password | None — authentication is **email + FAST Code** |
| FAST Code | `lrg1` / `LRG1` |
| Associated Mapsite™ | Seeded production template Mapsite™ `LRG1` |
| Associated Published Site | Active Mapsite™ for `LRG1` (when migrations applied) |

---

## 6. Seeded Mapsites™ / demo accounts (no passwords)

| Identifier | Role / type | Email on record | Password | Notes |
|------------|-------------|-----------------|----------|-------|
| FAST `DEMO` | Demonstration unclaimed Mapsite™ | `demo@talispros.com` | None | Fixed ID; used by `/talispros/mapsite` claim demos |
| FAST `LRG1` / `lrg1` | Root Account™ template Mapsite™ | Updated in seeds to `rahulc@talispros.com` (earlier seed used `lydia.gaertner@example.com`) | None | Active template; client analytics seed |

---

## 7. Root / Derivative / Adpro / Test plans (registration — not logins)

These appear as **registration plan types**, not pre-seeded login users:

| Plan | Label (UI) | Price (CAD) | Notes |
|------|------------|-------------|-------|
| `TEST_ACCOUNT` | TEST Account | $10 | Demo / QA Root-equivalent |
| `ROOT_ACCOUNT_1` | Root Account™ ($1) | $1 + GST | Demo activation |
| `ROOT_ACCOUNT` | Root Account™ | $998.50 (+ monthly listed in plans) | Full Root |
| `DERIVATIVE_ACCOUNT` | Derivative Account™ | $198.50 | Under a Root |
| `ADPRO_SINGLE` / `ADPRO_10` / `ADPRO_100` / `ADPRO_UNLIMITED` | Adpro PIN packs | Per plan | Adpro placements |

---

## 8. Brokerage scaffold contact (not a login)

| Field | Value |
|-------|--------|
| Name | Ralf Meyer (scaffold identity for future brokerage pages) |
| Email | `remecom@mac.com` |
| Phone | `902-317-2223` |
| Login? | **No** — used only in unused brokerage page scaffolds |

---

## 9. Environment variables expected for credentials / payments

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client / admin auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin writes |
| `MARKETING_MANAGER_EMAILS` | Marketing Admin allowlist |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Mapsite™ / registration PayPal |
| `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL` | Absolute share links |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| Map provider keys | Google / MapTiler / Mapbox / Esri as configured |

If Marketing Admin or PayPal fails during demo, credentials or keys are missing in the environment — not missing from this guide.

---

# Part 4 — Complete Demo Flow

Follow this sequence on the **current** implementation. Start audience labels match the Start page exactly (there is no separate “Builder” card on Start; builders are reached via markets / `audience=homes`).

---

### Step 1 — Open Start

**Open:** `/talispros/start`

**Expected result:** Full-page Start experience with slogan and four cards:

1. I am a Real Estate Broker or Owner  
2. I am a Real Estate Professional  
3. I am a For-Sale-By-Owner Seller  
4. I am an Adpro Service Provider  

[Screenshot Here]

---

### Step 2 — Choose audience

**For the FSBO acceptance path (recommended):** choose **I am a For-Sale-By-Owner Seller**.

**Expected result:** Browser navigates to `/talispros/mapsite?audience=fsbos`.

**Alternatives (same Mapsite™ shell, different audience):**

| Choice | URL |
|--------|-----|
| Broker or Owner | `/talispros/mapsite?audience=brokers` |
| Real Estate Professional | `/talispros/mapsite?audience=listings` |
| Adpro Service Provider | `/talispros/mapsite?audience=adpro` |

**Builders:** not a Start card. Use market page `/talispros/markets/talishouse-builders` or Mapsite™ `?audience=homes`.

[Screenshot Here]

---

### Step 3 — Open Mapsite™ (demo pin)

**On:** `/talispros/mapsite?audience=fsbos`

**Expected result:**

- Fullscreen map  
- Demonstration Mapsite™ pin (FAST Code `DEMO` when seeded)  
- Listing card / property flag available when the pin is selected  

[Screenshot Here]

---

### Step 4 — Open the property flag / popup

**Action:** Select the demo pin so the property popup opens.

**Expected result:** Listing imagery, property details, and either:

- **Claim a Market** (when status is unclaimed), or  
- Resource buttons MLS® / URL / TEB™ / TTV™ (when status supports resources)

Disabled resource buttons show as unavailable until Marketing Admin configures URLs.

[Screenshot Here]

---

### Step 5 — Claim a Market

**Action:** Click **Claim a Market**.

**Expected result:** Navigates to `/talispros/markets/claim-a-market` with `mapsiteId`, `audience`, and return path.

Complete the claim / registration form.

**Expected result on success:**

- Owner session established for the new FAST Code  
- Redirect to `/talispros/mapsite/{accountType}/{fastCode}?startHere=1`  
- Guided **Start Here** prompt may appear on the open flag  

[Screenshot Here]

---

### Step 6 — Post-claim Mapsite™ (payment)

**On:** Claimed Mapsite™ URL

**Expected result:**

- Market partner / claimed listing card  
- **PayPal payment card** while payment is not yet on file  
- Resource buttons may appear depending on status  

If `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is missing, the card shows that PayPal is not configured.

[Screenshot Here]

---

### Step 7 — Complete PayPal (when configured)

**Action:** Pay with the PayPal buttons on the Mapsite™ payment card.

**Expected result:**

- Payment processed via `processMapSiteRootPaypalPayment`  
- Redirect back into the Mapsite™ flow  
- Payment card replaced by **Express an Interest** when payment is on file  

[Screenshot Here]

---

### Step 8 — Express an Interest

**Expected result:** Contact form titled “Express an interest” with FAST Code shown. Submit name / contact details as prompted.

[Screenshot Here]

---

### Step 9 — Start Here → E-Book choice

**Action:** If the **Start Here** overlay is visible, click it (“Open your first Talisbook™”).

**Expected result:** Navigate to `/talispros/ebook-choice?...&yes=1` with two choices:

1. Generate My Own E-Book → `/talispros/ebook-generate`  
2. Have Rahul Build It For Me → `/talispros/ebook-rahul`  

No payment and no registration on this step.

[Screenshot Here]

---

### Step 10 — Sample E-Book (anytime)

**Open:** `/talisbooks/viewer` or `/talisbooks/viewer/sample-ebook`

**Expected result:** Soft-cover magazine-style viewer for the FSBO sample book (cover → spreads → Glasshouse brochure pages → soft back). No hardcover spine.

[Screenshot Here]

---

### Step 11 — Self-generate or Rahul assist

**Self path:** Complete `/talispros/ebook-generate` using property images / title / description / location.

**Rahul path:** Complete `/talispros/ebook-rahul` uploads so Marketing Admin can finish the book.

**Expected result:** Draft book available according to entitlements (first draft allowed before full activation; publish / multi-book features lock until Mapsite™ is activated).

[Screenshot Here]

---

### Step 12 — TEB™ library shelf

**Open:** `/talisbooks/library?fastCode={YOUR_CODE}`

**Expected result:** Shelf scoped to that FAST Code. TEB™ button on Mapsite™ also deep-links here when configured.

[Screenshot Here]

---

### Step 13 — Marketing Admin verification

**Open:** `/talispros/marketing/login` → `/talispros/marketing/admin`

**Expected result:** Your build / claim request appears in **Pending Build Requests**. Open detail, assign FAST Code if needed, configure resources, activate when ready.

[Screenshot Here]

---

### Step 14 — Open published / active Mapsite™ by FAST Code

**Open:** `/talispros/mapsite/{accountType}/{fastCode}` or `/ma/{fastCode}`

**Expected result:** Public Mapsite™ for that code with configured media and resource buttons.

[Screenshot Here]

---

# Part 5 — Marketing Admin Test

## How Rahul signs in

1. Go to `/talispros/marketing/login`  
2. Enter Supabase email + password  
3. Email must be allowed by `MARKETING_MANAGER_EMAILS` when that variable is set  
4. Success lands on Marketing Admin (`/talispros/marketing/admin`)  
5. Unauthorized users see `/talispros/marketing/unauthorized`

[Screenshot Here]

## How to view Build Requests

On `/talispros/marketing/admin`, use **Pending Build Requests**. The list refreshes automatically about every 10 seconds. Open a row to `/talispros/marketing/admin/[id]`.

Legacy equivalent: `/admin/marketing`.

## How to approve them

On the queue / detail page, use available actions such as:

- Set status (e.g. Under Review, Changes Requested, Awaiting Registration, Published, Rejected)  
- **Approve** build request (`marketingApproveBuildRequest`)  
- **Activate** Mapsite™ (`marketingActivateMapSite`)

Exact button labels appear on the admin UI for each request state.

## How FAST Codes are generated

Use **Assign FAST Code** / **Assign FAST Code** workflow actions on the request (`marketingAssignFastCode` / `assignFastCode`). After assignment, the FAST Code appears on the request and linked Mapsite™.

## How Mapsites™ are managed

1. **Generate draft Mapsite™** from the request (`marketingGenerateDraftMapSite`)  
2. Open `/talispros/admin/mapsites/[fastCode]` (or `/admin/mapsites/[fastCode]`) for full editor  
3. Update listing media, status, and resource URLs  

## How Published Sites are managed

1. Move build request status to **Published** when appropriate  
2. Ensure Mapsite™ status is **active**  
3. Share the public Mapsite™ URL (`/talispros/mapsite/.../{fastCode}` or `/ma/{fastCode}`)  
4. There is no dedicated “Published Sites” index page today  

## How E-Books are managed

On Mapsite™ admin (`MapSiteAdminEbookPanel`):

- Create / update draft from form fields  
- Edit pages, reorder non-permanent pages, replace images  
- Publish  
- Attach to TEB™ / copy viewer & shelf links  
- Open Talisbooks™ manager tools when linked from Marketing Admin detail  

## How links are copied

In Mapsite™ admin **Share registration links**:

1. Claim invite (pre-claim)  
2. Post-claim success Mapsite™ (pre-PayPal) — **disabled / greyed out after PayPal success**

Use **Copy** / **Open** on each row.

## How resource buttons are configured

On Marketing Admin request detail / Mapsite™ resources, set:

| Button | Field |
|--------|--------|
| MLS® | `mls_url` |
| URL (Broker) | `broker_url` |
| TEB™ | `teb_url` (or auto shelf via FAST Code) |
| TTV™ | `ttv_url` (defaults to `/talistv` when empty) |

Unconfigured buttons appear disabled on the Mapsite™ popup.

## How payment status changes

Completed PayPal capture is stored for the claim (`talispros_payments` / payment note). Effects:

- Pre-PayPal share link greys out  
- Mapsite™ payment card gives way to Express Interest  
- Admin UI can show payment received  

Also review `/admin/registrations` and `/admin/payments` for captured PayPal order / capture IDs.

---

# Part 6 — Mapsite™ Test

Test on `/talispros/mapsite` (DEMO) and on a claimed code URL.

| Item | How to test | Expected |
|------|-------------|----------|
| **PIN** | Select the property pin on the map | Pin focuses; listing sidebar / popup opens |
| **Flag** | Open property popup (“flag” card) | Listing photos, title, claim or resources |
| **MLS button** | With `mls_url` set | Opens MLS link; otherwise disabled |
| **Broker URL** | With `broker_url` set | Opens broker site; otherwise disabled |
| **TEB™** | Click TEB™ | Opens `/talisbooks/library?fastCode=...` (or custom absolute `teb_url`) |
| **TTV™** | Click TTV™ | Opens `ttv_url` or `/talistv` |
| **Registration / Claim** | Unclaimed → Claim a Market | Claim form; returns with `startHere=1` |
| **Express Interest** | After payment on file | Contact form under listing stack |
| **Sample E-Book** | Open viewer or TEB sample | Soft-cover sample book |
| **Published Site** | Open active FAST Code URL | Public Mapsite™ with live data |

[Screenshot Here] — PIN selected  
[Screenshot Here] — Flag / popup with resource buttons  
[Screenshot Here] — Claim form  
[Screenshot Here] — PayPal card  
[Screenshot Here] — Express Interest  
[Screenshot Here] — Active published Mapsite™  

---

# Part 7 — E-Book Test

## How sample books appear

- Built-in demo at `/talisbooks/viewer` (`createDemoViewerBook`, slug `sample-ebook`)  
- Also reachable as `/talisbooks/viewer/sample-ebook`  
- FSBO sample intentionally omits brokerage pages 2–3; Mapsite™ location is on page 2; permanent Glasshouse brochure sits before the soft back cover  

## How draft books appear

- Created via `/talispros/ebook-generate`, Rahul assist uploads, or Marketing Admin E-Book panel  
- Unactivated accounts may hold **one** draft  
- Drafts show on the FAST Code shelf / admin workbench before publish  

## How generated books appear

- Self-generate flow creates a draft from supplied property content  
- Admin publish marks the book published and attachable to TEB™  

## How books are opened

- Viewer: `/talisbooks/viewer/[slug]`  
- Library shelf: `/talisbooks/library?fastCode=...`  
- TEB™ resource button on Mapsite™  

## How page flipping works

In the soft-cover viewer:

1. Front cover  
2. Interior spreads (flip / navigate through pages)  
3. Permanent Glasshouse brochure pages near the end  
4. Soft back cover  

No hardcover spine in the current sample viewer.

## What should happen after registration

- First draft creation remains available  
- Full publish, multi-book, bookshelf capacity, derivative/adpro extras unlock when the Mapsite™ is **ACTIVE** / activated (`activated_at`)  
- Quotas after activation: Root / Derivative use standard shelf capacity; Adpro = 1 book per PIN shelf  

---

# Part 8 — Payment Test

## How PayPal is reached

1. Claim a Mapsite™ (or complete registration that leads to a claimed Mapsite™)  
2. On the Mapsite™, when claimed and unpaid, the **Complete registration** PayPal card appears  
3. Requires `NEXT_PUBLIC_PAYPAL_CLIENT_ID`  
4. Currency: CAD; intent: capture  

Alternate PayPal surfaces also exist on `/register`, `/register-mapsite`, and `/subscription` (legacy / other plans).

## What happens after payment

1. Server records PayPal order / capture for the Mapsite™ claim  
2. User is redirected to the success Mapsite™ URL from the payment action  
3. Express Interest unlocks  
4. Pre-PayPal share link disables in admin  

## What changes inside Admin

- Payment received flag on Mapsite™ share links / editor  
- Registrations / payments admin pages show PayPal IDs when present  
- Marketing can proceed with activation / Published status as appropriate  

## Which buttons become enabled

| Before payment | After payment |
|----------------|---------------|
| PayPal checkout card | Express Interest form |
| Pre-PayPal share link active | Pre-PayPal share link disabled |
| Publish / multi-book may still wait for Mapsite™ activation | Activation + payment path unlocks entitlements when status is ACTIVE |

Resource buttons (MLS / URL / TEB / TTV) depend on URL configuration, not solely on PayPal.

## Which links become active

- Post-payment: Express Interest on Mapsite™  
- Claim invite link remains usable for new claimants as designed  
- TEB / viewer links activate when books exist and URLs are set  

---

# Part 9 — Known Limitations

Only items evidenced in code as incomplete, stubbed, “coming soon,” placeholders, or intentionally unwired:

| Limitation | Evidence |
|------------|----------|
| SimpleTexting not integrated as a live product step | E-Book choice is documented as “Post–SimpleTexting YES”; actual handoff used in-app is Start Here → `ebook-choice?yes=1` |
| Brokerage E-Book pages 2–3 not in live sample | Brokerage scaffolds exist but are intentionally omitted from FSBO demo viewer |
| Talisbooks™ dashboard areas incomplete | Layouts, images, pages, authors, settings pages show “coming soon” |
| Talismaps™ dashboard areas incomplete | Themes, media, imports, analytics show “coming soon” |
| Client books portal scaffold | `/talispros/client/books` states editing is not enabled yet |
| Business office associate registration | `/business-office/register` shows “Coming soon...” |
| Business office auth gate | `/business-office/*` (except apply) requires `auth` cookie via middleware |
| PayPal depends on env | Missing `NEXT_PUBLIC_PAYPAL_CLIENT_ID` blocks Mapsite™ checkout UI |
| Marketing Admin passwords not in repo | Must use Supabase Auth + optional email allowlist |
| Map provider placeholder keys | Dev warnings when map keys are placeholders / missing |
| Automatic full publishing workflow | Draft → publish requires admin / entitlement gates; not a fully automatic end-to-end publisher |
| Glasshouse brochure | Permanent pages exist in the sample structure; treat as fixed brochure pages, not a separate editable Glasshouse product flow inside Mapsite™ |
| Partner / older build stack | Legacy `/build-mapsite` and older admin paths coexist with Talispros paths — prefer `/talispros/...` for demos |

---

# Part 10 — Checklist

## Start & Mapsite™

- [ ] Open `/talispros/start`  
- [ ] Select **For-Sale-By-Owner Seller**  
- [ ] Confirm Mapsite™ opens with `audience=fsbos`  
- [ ] Select demo PIN  
- [ ] Open property flag / popup  
- [ ] Confirm Claim a Market (unclaimed)  
- [ ] Complete claim form  
- [ ] Confirm return to Mapsite™ with `startHere=1`  
- [ ] Confirm Start Here overlay (if not previously dismissed)  

## Resources & media

- [ ] View listing photos / gallery  
- [ ] Confirm MLS button state (configured vs disabled)  
- [ ] Confirm Broker URL button state  
- [ ] Open TEB™ (shelf or custom URL)  
- [ ] Open TTV™  

## E-Book

- [ ] Open `/talisbooks/viewer` sample  
- [ ] Flip through cover → interior → Glasshouse pages → back  
- [ ] From Start Here, open E-Book choice  
- [ ] Try Generate My Own path  
- [ ] Try Have Rahul Build It path  
- [ ] Open `/talisbooks/library?fastCode=...`  

## Payment & interest

- [ ] Confirm PayPal card on unpaid claimed Mapsite™  
- [ ] Complete PayPal (sandbox / live as provided)  
- [ ] Confirm Express Interest appears  
- [ ] Submit Express Interest form  

## Marketing Admin

- [ ] Sign in at `/talispros/marketing/login`  
- [ ] View pending build requests  
- [ ] Open request detail  
- [ ] Assign FAST Code  
- [ ] Generate draft Mapsite™ (if needed)  
- [ ] Configure MLS / Broker / TEB / TTV URLs  
- [ ] Copy claim & post-claim share links  
- [ ] Confirm pre-PayPal link disables after payment  
- [ ] Manage / publish E-Book from Mapsite™ admin panel  
- [ ] Activate / set Published as appropriate  

## Published / client

- [ ] Open active Mapsite™ by FAST Code  
- [ ] Optional: client login `rahulc@talispros.com` + `lrg1`  
- [ ] Optional: CRM codes ADMIN / MANAGER / ASSOCIATE  
- [ ] Optional: platform admin FAST Code `ADMIN123`  

## Negative / env checks

- [ ] Note any missing PayPal client ID  
- [ ] Note any Marketing Admin allowlist rejection  
- [ ] Note any map tile / key warnings  

---

# Part 11 — Developer Appendix

**Audience:** Arun & Rahul only. Not required for Ralf’s acceptance walkthrough.

---

## Folder structure (relevant)

```
app/
  talispros/          # Start, Mapsite™, claim, register, ebook, marketing, admin, client
  talisbooks/         # Library, viewer, dashboard, editor
  talismaps/          # Maps product + dashboard/editor
  admin/              # Legacy platform admin
  crm/                # CRM role-code console
  api/                # REST handlers (fast-code, talismaps, build upload, cron, …)
  build-mapsite/      # Legacy build form
  ma/[fastcode]/       # Legacy public Mapsite™
components/
  talispros/          # Start, claim, Mapsite™ UI, ebook clients
  talispros-admin/    # Mapsite™ admin editor, ebook panel, share links
  talisbooks/         # Viewer shell, library shell
  talismaps/          # Map engine embeds / editor
lib/
  talispros/          # Mapsite™ state, audience, platform loaders
  talisbooks/         # Viewer, entitlements, ebook services, permanent pages
  registration-*.ts   # Plans / markets
  marketing-manager-auth.ts
  talispros-admin-auth.ts
  client-analytics-auth.ts
supabase/migrations/  # Schema + seeds (DEMO, LRG1, analytics)
docs/                 # This guide + prior reports
```

---

## Relevant pages (code)

| Concern | Primary files |
|---------|----------------|
| Start segments | `lib/talispros/start-content.ts`, `components/talispros/TalisprosStartSidebar.tsx` |
| Mapsite™ app | `components/talispros/mapsite/MapSiteApplication.tsx` |
| Claim success | `components/talispros/ClaimMarketRegistrationClient.tsx` |
| Payment card | `components/talispros/mapsite/MapSitePaymentCard.tsx` |
| Express Interest | `components/talispros/mapsite/MapSiteExpressInterestCard.tsx` |
| Resource buttons | `components/talispros/mapsite/MapSitePropertyPopup.tsx` |
| E-Book choice | `lib/talispros/ebook-choice.ts`, `components/talispros/EbookChoiceClient.tsx` |
| Sample viewer | `app/talisbooks/viewer/page.tsx`, `lib/talisbooks/viewer/demo-book.ts` |
| Entitlements | `lib/talisbooks/entitlements.ts` |
| Marketing admin | `app/talispros/marketing/admin/*` |
| Shared marketing actions | `app/admin/marketing/actions.ts` |
| Admin ebook panel | `components/talispros-admin/MapSiteAdminEbookPanel.tsx` |

---

## Relevant API endpoints

| Method / path | Role |
|---------------|------|
| `POST /api/fast-code/generate` | FAST Code generation |
| `POST /api/talispros/build-mapsite/upload` | Build asset upload |
| `/api/talismaps/geocode` | Geocoding |
| `/api/talismaps/editor/bootstrap` | Editor bootstrap |
| `/api/talismaps/maps/[mapId]/pins` | Pins CRUD |
| `/api/talismaps/maps/[mapId]/pins/[pinId]` | Pin detail |
| `/api/talismaps/settings` | Platform settings |
| `/api/cron/weekly-marketing-report` | Weekly report cron |
| `/api/match-submit` | Match flow submit |
| `/api/product-images` | Product images |
| `/api/projects/create` | Project create |
| `/api/test-insert` | Test insert (dev) |
| `/api/fix-rls` | RLS check |

Most demo mutations use **Server Actions** under `app/talispros/**/actions.ts` and `app/admin/marketing/actions.ts`, not REST.

---

## Relevant database tables

From `lib/database.types.ts` / migrations (non-exhaustive but demo-critical):

| Table | Use |
|-------|-----|
| `mapsites` | Mapsite™ records, status, resource URLs, FAST Code |
| `pins` | Map pins under Mapsites™ |
| `accounts` | Account rows (client login match) |
| `fast_codes` | FAST Code registry |
| `build_requests` | Claim / build queue |
| `build_request_registrations` | Registration linkage |
| `mapsite_requests` / `mapsite_assets` | Legacy / asset pipeline |
| `talispros_payments` | Mapsite™ PayPal payment notes |
| `registrations` / `payments` | Registration PayPal captures |
| `categories` | Account categories (root, etc.) |
| `client_marketing_metrics` / `client_weekly_reports` | Client dashboard |
| `talisbooks_books` / `talisbooks_book_pages` / related | E-Books |
| `talismaps_*` | Maps product tables |
| `production_queue` / `activity_logs` | Ops |

---

## Authentication flow

| Surface | Mechanism |
|---------|-----------|
| Marketing / Talispros admin | Supabase email+password session (`lib/talispros-admin-auth.ts`); marketing gated by `MARKETING_MANAGER_EMAILS` |
| Platform `/admin` | FAST Code `ADMIN123` → `admin_session` cookie |
| Client analytics | Email + FAST Code match on `accounts` or `mapsites` → `client_analytics_session` cookie |
| CRM | Local role codes ADMIN / MANAGER / ASSOCIATE |
| Mapsite™ owner | `mapsite_owner_fast_code` / root account cookies after claim |
| Business office | Middleware requires `auth` cookie except `/business-office/apply` |

---

## FAST Code generation

1. Public generator: `/fast-code` (+ `/api/fast-code/generate`)  
2. Marketing Admin: `assignFastCode(requestId)` from build request workflow  
3. Claim success may return a new FAST Code and establish owner session  

Seeded codes: `DEMO`, `LRG1`/`lrg1`. Admin login code: `ADMIN123`.

---

## Mapsite™ lifecycle

Platform statuses (normalized):

`UNCLAIMED` → `BUILD_REQUEST_SUBMITTED` → `MARKETING_REVIEW` → `ACTIVE` → `ARCHIVED`

- Claimable when `UNCLAIMED`  
- Resource actions when submitted / review / active  
- Demo Mapsite™: id `00000000-0000-4000-8000-000000000001`, FAST `DEMO`, `is_demonstration = true`

---

## Published Site lifecycle

1. Build / claim request created  
2. FAST Code assigned; draft Mapsite™ generated  
3. Assets / resources configured  
4. Payment may complete on Mapsite™  
5. Marketing activates Mapsite™ (`activated_at` / status `active`)  
6. Build request may be marked **Published**  
7. Public URL shared: `/talispros/mapsite/{accountType}/{fastCode}` or `/ma/{fastCode}`

---

## Build Request lifecycle

1. User claims market or submits `/talispros/build-mapsite`  
2. Row appears in Marketing Admin queue  
3. Actions: assign FAST Code, generate Mapsite™, send registration, update status, update assets/resources, approve, activate  
4. Linked Mapsite™ and payments connect through request id / FAST Code  

---

## Entitlements (Talisbooks™)

See `lib/talisbooks/entitlements.ts`:

- Unactivated: 1 draft only  
- Activated Root / Derivative: shelf capacity  
- Activated Adpro: 1 book  
- Does **not** modify PayPal capture helpers  

---

*End of guide. For environment-specific passwords and PayPal sandbox accounts, use the team’s secure credential store — they are intentionally absent from source control.*
