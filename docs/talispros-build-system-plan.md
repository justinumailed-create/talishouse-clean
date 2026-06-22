# TalisPros Build System — Codebase Audit & Architecture Plan

> **Audit Date:** 2026-06-22
> **Repository:** talishouse-clean

---

## 1. IDENTIFICATION

### Framework & Runtime

| Component | Version |
|---|---|
| Next.js | **16.2.1** (⚠️ AGENTS.md warns of breaking changes from standard Next.js) |
| React | **19.2.4** |
| TypeScript | **^5** |
| Node.js | (inferred: >= 20.x) |
| Tailwind CSS | **^4** (with `@tailwindcss/postcss`) |
| Framer Motion | **12.38.0** |
| PayPal | `@paypal/react-paypal-js` **^9.1.0** |
| ESLint | **^9** with `eslint-config-next` 16.2.1 |

### Database Provider

| Detail | Value |
|---|---|
| **Provider** | **Supabase** (PostgreSQL) |
| Package | `@supabase/supabase-js` **^2.100.1** |
| Client (anon) | `lib/supabaseClient.ts` — wraps `createClient` with custom `fetch` logger |
| Client (admin) | `lib/supabaseAdmin.ts` — service-role client, server-side only |
| Tables in Supabase | **17 tables** defined in migrations (plus 1 external `products` table) |
| RLS | Enabled on most tables, disabled on `GlobalContent` and `pricing_config` |
| Data fallback | `data/associates.json` — local file-based store via `lib/db.ts` |

### Authentication System

| Aspect | Current Implementation |
|---|---|
| **Type** | **Client-side only** — localStorage + cookies |
| Mechanism | FAST code-based identity via `lib/fast-code.ts` |
| Admin auth | Hardcoded code `"ADMIN123"` checked via `isValidAdminFastCode()` |
| Cookie name | `admin_session` (24hr expiry) — set by `setAdminSession()` |
| Middleware check | `middleware.ts` checks cookie named `auth` (⚠️ **mismatch** — middleware cookie `auth` ≠ client cookie `admin_session`) |
| Context | `context/AuthContext.tsx` — wraps `useState` + localStorage sync |
| Security concern | **No server-side session validation. Any client can set localStorage to impersonate any FAST code.** |
| Session persistence | localStorage values: `fast_code`, `role`, `associateId` |
| Tab sync | `window.addEventListener("storage", ...)` in AuthContext |

### Storage Provider

| Aspect | Current Implementation |
|---|---|
| **File/Image Storage** | **Local filesystem** (`public/images/`) |
| Supabase Storage | **Not used** — no bucket configuration exists |
| Product images | Hardcoded paths in `lib/productImages.ts` and `lib/products.ts` |
| DB image URLs | `product_images` table stores URLs (fetched by `useProductImages` hook) |
| Associate images | `TEXT[]` column on `users` / `associates` tables (URL strings) |
| Static assets | `/public/images/`, `/public/videos/`, `/public/seo/`, `/public/og/` |

---

## 2. EXISTING SYSTEMS

### FAST Code System

**Status: ✅ Exists**

| Component | Location |
|---|---|
| Registration page | `app/fast-code/page.tsx` — form collecting first/last name, email, phone, address, province |
| Registration action | `app/fast-code/actions.ts` — `registerFastCode()` server action, inserts into `fast_code_registrations` |
| Code generation | `lib/fast-code-generator.ts` — `generateFastCode()` creates codes like `JD14-ttv` from initials |
| Auth utilities | `lib/fast-code.ts` — `getFastCode()`, `setFastCode()`, `clearFastCode()`, admin detection |
| Admin management | `app/admin/fast-codes/page.tsx` — CRUD for FAST codes |
| DB table | `fast_code_registrations` — `fast_code`, `first_name`, `last_name`, `email`, `cell_phone`, `street_address`, `province` |

### Partner Access System

**Status: ✅ Exists**

| Component | Location | Description |
|---|---|---|
| Partner Access page | `app/partner-access/page.tsx` | Fast code entry form → redirects to `https://talispros.com/ma/{code}` |
| Partner View | `app/partner-view/page.tsx` | Map + video + lead form for partners |
| TTV Access | `app/ttvaccess/[fastCode]/page.tsx` | Server component, fetches associate data, renders partner view |
| MapSite by slug | `app/mapsite/[slug]/page.tsx` | Server component, fetches associate by `mapsite_slug`, renders `AssociateHero` |
| MapSite router | `app/mapsite/page.tsx` | Redirects to first associate or shows demo |
| Fast code redirect | `app/a/[fastCode]/page.tsx` | Server component, redirects to `/associate/[fastCode]` |
| Associate page | `app/associate/[fastCode]/page.tsx` | Server component, fetches associate, renders `AssociateView` |
| Associate page config | `lib/associateConfig.ts` | Hardcoded per-associate UI config |

### Admin Dashboard

**Status: ✅ Exists — 17 sub-routes**

| Admin Route | Purpose |
|---|---|
| `/admin` | Dashboard (stats, associate creation form) |
| `/admin/login` | FAST code admin login |
| `/admin/dashboard` | Deals/earnings stats dashboard |
| `/admin/associates` | Associate list + create |
| `/admin/associates/[id]` | Associate settings editor |
| `/admin/users` | Users management |
| `/admin/users/[id]` | User profile with leads/deals |
| `/admin/leads` | Leads management with deal modal |
| `/admin/leads-simulation` | CSV import + quick simulation |
| `/admin/deals` | Deal pipeline with edit modal |
| `/admin/projects` | Project CRUD with status |
| `/admin/payments` | Payment history view |
| `/admin/applications` | Associate applications |
| `/admin/project-applications` | Project applications + FAST code generation |
| `/admin/pricing` | Pricing config editor |
| `/admin/products` | Product price/image editor |
| `/admin/content` | GlobalContent editor |
| `/admin/talisbot` | TalisBOT analytics dashboard |
| `/admin/fast-codes` | FAST code CRUD with search |

---

## 3. INVENTORY

### 3.1 Current Routes (54 total)

#### Public Routes (30)
`/`, `/a/[fastCode]`, `/add-project`, `/associate-status`, `/associate/[fastCode]`, `/catalog`, `/catalogue`, `/checkout`, `/dealers`, `/fast-code`, `/find-your-market`, `/glasshouse`, `/lease-to-own`, `/mapsite`, `/mapsite/[slug]`, `/match-results`, `/partner-access`, `/partner-view`, `/privacy`, `/project-received`, `/propose-project`, `/subscription`, `/success`, `/talishouse`, `/talishouse-recreational`, `/talishouse-residential`, `/talistowns`, `/terms`, `/ttvaccess/[fastCode]`

#### Business Office Routes (4)
`/business-office`, `/business-office/apply`, `/business-office/propose-project`, `/business-office/register`, `/business-office/transactions`

#### Admin Routes (17)
`/admin`, `/admin/login`, `/admin/dashboard`, `/admin/associates`, `/admin/associates/[id]`, `/admin/users`, `/admin/users/[id]`, `/admin/leads`, `/admin/leads-simulation`, `/admin/deals`, `/admin/projects`, `/admin/payments`, `/admin/applications`, `/admin/project-applications`, `/admin/pricing`, `/admin/products`, `/admin/content`, `/admin/talisbot`, `/admin/fast-codes`

#### API Routes (5)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/product-images` | GET | Fetch product image URL map |
| `/api/test-insert` | GET | Test Supabase leads insert |
| `/api/match-submit` | POST | Submit match form lead |
| `/api/projects/create` | POST | Stub project creation |
| `/api/fix-rls` | POST | Service-key leads insert test |

### 3.2 Database Tables (18 total)

| # | Table | Purpose | Key Columns |
|---|---|---|---|
| 1 | `leads` | Lead capture from all sources | name, phone, email, location, fast_code, status, project_value, commission_rate, split_percentage, deal_status, associate_id, message |
| 2 | `users` | User/associate accounts | name, phone, email, fast_code (UNIQUE), role, intro_message, images[], contact_phone, page fields |
| 3 | `deals` | Deal/sales tracking | user_id, client_name, phone, project_type, status, value, fast_code, project_details, base_price, addons_value, source |
| 4 | `associates` | Associate profile/storefront | name, email, fast_code (UNIQUE), intro_message, images[], page fields, hero_type, hero_content, video_url, show_form, show_video, mapsite_slug (UNIQUE) |
| 5 | `associate_applications` | Associate program applications | name, email, phone, location, preferred_fast_code, role_type, status |
| 6 | `applications` | Project applications | name, email, phone, location, participation_level, status |
| 7 | `transactions` | Payment/split transactions | deal_id, fast_code, amount, payment_type |
| 8 | `earnings` | Associate commission earnings | user_id, deal_id, fast_code, amount, type |
| 9 | `contact_logs` | Associate contact messages | fast_code, message |
| 10 | `pricing_config` | Admin pricing configuration | tax_rate, full_payment_enabled, partial_payment_enabled |
| 11 | `GlobalContent` | CMS page content | id (PK text), title, summary, displayType |
| 12 | `assistant_messages` | General assistant messages | name, phone, email, message |
| 13 | `assistant_leads` | TalisBOT lead details | session_id, name, phone, email, intent, size, budget, location, finish, installation, recommended_product_ids, last_step |
| 14 | `talisbot_chat_logs` | TalisBOT conversation logs | session_id, step, user_input, bot_response, metadata (JSONB) |
| 15 | `leads_match` | Match quiz leads | goal, budget_min, budget_max, timeline, location, home_type, home_size_sqft, financing_needed, land_owned, name, email, phone, recommended_product |
| 16 | `products` | Product catalog (⚠️ **no migration**) | id, name, category, size, price, image_url |
| 17 | `product_images` | Dynamic product image URLs | (referenced by hook, no migration found) |
| 18 | `fast_code_registrations` | FAST code sign-ups | fast_code (UNIQUE), first_name, last_name, email, cell_phone, street_address, province |

### 3.3 Existing APIs / Data Access Layer

| Module | Key Functions |
|---|---|
| `lib/supabase.ts` | `safeInsertMatchLead()`, `safeInsertLead()` — sanitized inserts with allowed-field filtering |
| `lib/supabaseAdmin.ts` | `supabaseAdmin` — service-role client for privileged ops |
| `lib/splits.ts` | `calculateSplits()`, `validateFastCode()`, `getUserByFastCode()`, `syncTransactionToSplits()`, `getAssociateEarnings()`, `getTotalEarnings()` |
| `lib/products.ts` | `getModelsByCategory()`, `getDefaultModel()` |
| `lib/productFamilies.ts` | `getProductFamily()` |
| `lib/productImages.ts` | `getProductImage()` |
| `lib/pricingEngine.ts` | `calculateTotal()`, `calculateLeaseToOwn()`, `calculatePartialPayment()`, `getPricingConfig()`, `setPricingConfig()` |
| `lib/discounts.ts` | `applyDiscounts()`, `validateDiscountCode()`, `getDiscountInfo()`, `getAllDiscountCodes()`, `formatDiscount()` |
| `lib/projectCode.ts` | `generateProjectCode()` |
| `lib/fast-code-generator.ts` | `generateFastCode()`, `extractInitials()` |
| `lib/db.ts` | `getAssociates()`, `saveAssociates()` — JSON file fallback |
| `lib/hooks/useProductImages.ts` | `useProductImages()` — React hook fetching `product_images` table |

### 3.4 File Upload Functionality

**Status: ❌ None exists**

- No Supabase Storage buckets configured
- No file upload endpoints (no `multipart/form-data` handling)
- No `<input type="file">` usage found
- Associate images are stored as URL strings in `TEXT[]` columns
- Product images are hardcoded paths under `public/images/` or URLs from `product_images` table

### 3.5 Email Functionality

**Status: ❌ None exists**

- No email sending library (no nodemailer, Resend, SendGrid, etc.)
- No email templates
- No `mailto:` or transactional email flows
- Contact forms collect email/phone data and store in Supabase only (no notification)

---

## 4. ARCHITECTURE RECOMMENDATIONS

### 4.1 Build Form

**Status:** Currently fragmented across `/add-project`, `/business-office/apply`, `/propose-project`, `/app/project-applications`

**Recommended Architecture:**

```
app/build/
├── page.tsx                  # Build Form entry / choose-your-path
├── layout.tsx                # Shared step navigation
├── steps/
│   ├── step-01-location.tsx  # Map pin + address autocomplete
│   ├── step-02-product.tsx   # Product family & model selector
│   ├── step-03-config.tsx    # Configurator (siding, kitchen, bath, flooring)
│   ├── step-04-addons.tsx    # Add-on packages
│   └── step-05-review.tsx    # Quote summary + contact form
├── api/
│   └── create/route.ts       # POST: validate, insert lead/project, trigger notification
└── actions.ts                # Server actions for form steps
```

**Data Flow:**
1. Step form → client-side validation → `useReducer` for multi-step state
2. On submit → server action or API route → insert into `leads` + optional `projects` table
3. If associate is linked (fast code from URL or auth) → associate commission tracking
4. Notification via future email/SMS system

**Dependencies to add:**
- Form library (React Hook Form + Zod for validation)
- Map component (existing `MapComponent` or Google Places Autocomplete)
- Pricing engine (already exists in `lib/utils/pricingEngine.ts`)

**Suggested Tables:**
| Table | Columns | Purpose |
|---|---|---|
| `projects` | (exists but underused) — extend with `product_id`, `config_options` JSONB, `addon_ids` TEXT[], `total_quote` NUMERIC | Store full build config |
| `project_applications` | (exists as `applications`) — or rename to `build_submissions` | Track submission lifecycle |

---

### 4.2 FAST Code Generator

**Status:** ✅ Exists at `/fast-code` + `lib/fast-code-generator.ts`

**Recommended Enhancements:**

```
app/fast-code/
├── page.tsx              # Public registration page (existing)
├── success/page.tsx      # Post-registration success with MapSite redirect
└── admin/
    ├── page.tsx          # Existing /admin/fast-codes
    └── [id]/page.tsx     # Detail view for a FAST code registration
```

**Improvements:**
1. **Email notification** on registration (welcome + next steps)
2. **Admin approval workflow**: `fast_code_registrations.status` → `pending` / `approved` / `rejected`
3. **Auto-provision** associate record in `associates` table upon approval
4. **MapSite auto-creation**: generate `mapsite_slug` from fast code automatically
5. **Rate limiting** on the `registerFastCode` server action
6. **Duplicate detection** by email + phone before allowing re-registration

**Backend additions:**
- `lib/email.ts` — transactional email service (Resend recommended)
- `lib/template/fast-code-welcome.ts` — email template

---

### 4.3 MapSite Production Queue

**Status:** Currently ad-hoc — MapSites are created via admin CMS or seed script

**Recommended Architecture:**

```
app/admin/mapsites/
├── page.tsx              # Queue dashboard — all MapSites with statuses
├── [id]/
│   ├── page.tsx          # MapSite detail + preview
│   └── settings/page.tsx # Advanced settings
└── api/
    ├── queue/route.ts    # POST: enqueue MapSite for production
    └── deploy/route.ts   # POST: deploy/provision a MapSite
```

**Suggested Table:**

```sql
CREATE TABLE mapsite_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID REFERENCES associates(id),
  fast_code TEXT NOT NULL,
  mapsite_slug TEXT UNIQUE,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'building', 'deployed', 'failed')),
  config JSONB DEFAULT '{}',
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Queue Workflow:**
```
draft → pending → building → deployed
                  ↓
               failed (retry)
```

**Generation steps:**
1. Select associate → create queue entry (`draft`)
2. Fill MapSite config (hero type, content, video, form toggle) → move to `pending`
3. Build process (could be async job or webhook) → `building`
4. Deploy to CDN or update DB → `deployed`
5. Associate URL: `/mapsite/{slug}` (already exists)

---

### 4.4 Admin Dashboard

**Status:** ✅ Exists — but needs unification and improvements

**Recommended Architecture:**

```
app/admin/
├── page.tsx              # Overview dashboard (existing, enhance)
├── login/
│   └── page.tsx          # Auth login (existing)
├── layout.tsx            # Shell with sidebar + auth guard (existing, improve)
├── dashboard/
│   └── page.tsx          # KPI dashboard with charts (existing)
├── associates/           # Existing
├── users/                # Existing
├── leads/                # Existing
├── deals/                # Existing
├── projects/             # Existing
├── payments/             # Existing
├── pricing/              # Existing
├── products/             # Existing
├── content/              # Existing
├── talisbot/             # Existing
├── fast-codes/           # Existing
├── mapsites/             # NEW: MapSite queue management
├── applications/         # Existing
├── project-applications/ # Existing
└── partners/             # NEW: Partner management hub
```

**Critical Fixes Needed:**
1. **Authentication** — Replace client-side FAST code admin auth with a proper session system:
   - NextAuth.js / Auth.js with credentials or magic-link provider
   - Supabase Auth (built-in) for admin accounts
   - At minimum: server-side session validation with HTTP-only cookies
2. **Fix middleware cookie mismatch** — `middleware.ts` checks `auth` cookie but `fast-code.ts` sets `admin_session`
3. **Service separation** — Admin API routes should use `supabaseAdmin` (service role) exclusively for write operations
4. **Audit logging** — Track admin actions in an `admin_logs` table

**Additional improvements:**
- Role-based access: `super_admin` / `admin` / `support`
- CSV export for leads, deals, payments
- Dashboard charts (use recharts or similar)
- Notification center (lead notifications, new applications)

---

### 4.5 Associate Dashboard

**Status:** ⚠️ Partial — `/business-office` exists but is minimally functional

**Recommended Architecture:**

```
app/associate/
├── dashboard/
│   ├── page.tsx          # KPI: leads count, earnings, active deals
│   ├── layout.tsx        # Protected layout with sidebar navigation
│   ├── leads/
│   │   └── page.tsx      # View leads attributed to this FAST code
│   ├── deals/
│   │   └── page.tsx      # Deal pipeline (won/lost/pending)
│   ├── earnings/
│   │   └── page.tsx      # Commission history (from earnings table)
│   ├── mapsite/
│   │   └── page.tsx      # Edit their MapSite (hero, content, images)
│   ├── referrals/
│   │   └── page.tsx      # Referral link + QR code generator
│   └── settings/
│       └── page.tsx      # Profile settings (name, phone, contact info)
```

**Data Access (Associate-scoped):**

Every query must filter by `fast_code` to ensure associates only see their own data.

```
supabase
  .from("leads")
  .select("*")
  .eq("fast_code", associateFastCode)
```

**Auth Flow:**
1. Associate enters FAST code on `/business-office` (existing `FastCodeGate`)
2. System validates code against `associates` table
3. Creates a verified session (server-side, HTTP-only cookie)
4. Redirects to `/associate/dashboard`

**Key Features:**
- **Lead notifications**: Real-time or polling for new leads attributed to their FAST code
- **MapSite editor**: Change hero type (map/image/video), headline, CTA, contact form toggle
- **Referral tools**: Shareable link (`/a/{fastCode}`), QR code download
- **Earnings dashboard**: From `earnings` table, with 20/80 split breakdown
- **Mobile-friendly**: Responsive design for on-the-go access

---

## 5. CROSS-CUTTING CONCERNS

### 5.1 Authentication Overhaul

| Concern | Current | Recommended |
|---|---|---|
| Admin auth | "ADMIN123" hardcoded, client-side | Supabase Auth or Auth.js with credentials |
| Associate auth | localStorage `fast_code` | Server-validated session with HTTP-only cookie |
| Middleware | Cookie `auth` (dead code) | Sync middleware with actual auth cookie name |
| RLS | Anon users can SELECT/INSERT most tables | Restrict to authenticated-only with associate-scoped policies |

### 5.2 Missing Email System

**Recommendation:** Add `lib/email.ts` with Resend (recommended) or SendGrid.

**Send triggers:**
- FAST code registration → welcome email with MapSite link
- Lead capture → notify assigned associate
- Deal won/lost → notify associate
- Admin creates associate → credentials email
- New application → admin notification

### 5.3 Missing File Upload

**Recommendation:** Configure Supabase Storage buckets:

| Bucket | Purpose | Access |
|---|---|---|
| `associate-images` | Associate profile images | Public read, authenticated write |
| `product-images` | Product photos | Public read, admin write |
| `mapsite-media` | MapSite hero images/videos | Public read, associate write |
| `admin-documents` | Project docs, contracts | Authenticated read/write |

Implement via `app/api/upload/route.ts` using Supabase Storage SDK.

### 5.4 Environment Variables Audit

| Variable | Present | Required For |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ `.env` + `.env.local` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ `.env` | Supabase client |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | ✅ `.env` | PayPal buttons |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **Missing** | Admin API routes |
| `RESEND_API_KEY` (or equivalent) | ❌ **Missing** | Email system |
| `NEXT_PUBLIC_SITE_URL` | ❌ **Missing** | Canonical URLs, OG tags |
| `ADMIN_EMAIL` | ❌ **Missing** | Notification recipient |

### 5.5 Migration Hygiene

| Issue | Status |
|---|---|
| Duplicate migration prefixes (`002`, `012`) | ⚠️ Fix: renumber sequentially |
| `products` table missing migration | ⚠️ Create migration file |
| `product_images` table missing migration | ⚠️ Create migration file |
| Duplicate column `email` added to `leads` (migrations 014 + 018) | ⚠️ Consolidate |
| `deals` table re-created (v1 then v2) | ⚠️ Clean up or document |
| `pricing_config` dropped and re-created | ⚠️ Clean up |

---

## 6. SUMMARY OF GAPS

| Capability | Current State | Priority |
|---|---|---|
| **Auth (admin)** | Client-side only, hardcoded code | 🔴 Critical |
| **Auth (associate)** | Client-side localStorage | 🔴 Critical |
| **Email system** | Not implemented | 🔴 Critical |
| **File upload** | Not implemented | 🟡 High |
| **MapSite production queue** | Not implemented | 🟡 High |
| **Build form** | Fragmented across 3 routes | 🟡 High |
| **Associate dashboard** | Minimal (/business-office) | 🟡 High |
| **Admin dashboard** | Functional but unpolished | 🟢 Medium |
| **FAST Code system** | Functional, needs workflow | 🟢 Medium |
| **RLS policies** | Overly permissive (anon access) | 🟡 High |
| **Middleware auth sync** | Broken (cookie name mismatch) | 🔴 Critical |
| **Database migrations** | Inconsistent numbering, missing tables | 🟢 Medium |
