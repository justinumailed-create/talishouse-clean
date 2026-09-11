# Talispros™ /admin access — Ralph & Arun

Login uses the existing FAST-code admin session (`hasAdminSession` / `admin_session` cookie). There is no separate console.

## Login

**URL:** `/admin/login`  
Production example: `https://talispros.com/admin/login` (or the current Vercel host).

Enter the FAST code and continue. Codes are case-insensitive.

| Person | Email | FAST code | Access |
|--------|-------|-----------|--------|
| Ralph | `remecom@mac.com` | `rm22` | Site ops: content, build requests, Mapsites, Talisbooks / bookshelves |
| Arun | `arun@kyptronix.com` | `ARUN` | Full `/admin` console |
| Platform | — | `ADMIN123` | Full `/admin` console (existing) |

There is no password on this screen. The FAST code *is* the credential, matching the existing admin auth.

Arun was not given a customer FAST code, so `ARUN` is the admin login code. Ralph’s `rm22` is also his live Root Mapsite™ code; using it at `/admin/login` opens admin. Entering `rm22` on a Mapsite™ / business-office gate does **not** grant admin (only `ADMIN123` still does there).

## What each person can edit

After login, the sidebar lists the tools below. Ralph only sees site-ops items; Arun sees those plus the rest of the existing console (associates, registrations, marketing, …). This PR does not add a new payment/pricing admin.

| Nav item | Path | What you can do |
|----------|------|-----------------|
| Content | `/admin/content` | CMS-style GlobalContent text/content for the public site |
| Build requests | `/admin/build-requests` | See submissions and act (assign FAST code, generate Mapsite™, send registration, reject). Detail/edit at `/admin/marketing/[id]` |
| Mapsites | `/admin/mapsites` | List Mapsites™; open one to edit listing text, images/media, pin, and linked eBook |
| Talisbooks™ | `/admin/talisbooks` | Books admin, centerfolds, pin public shelf |
| Bookshelves | `/admin/talisbooks/bookshelves` | Public library + per-Mapsite™ TEB™ shelves |

## Verify steps

1. Open `/admin/login` while logged out. Confirm the FAST code field is shown.
2. Sign in as Ralph with `rm22`. Confirm the sidebar shows **Content**, **Build requests**, **Mapsites**, **Talisbooks™**, **Bookshelves**, and “Signed in as Ralph”. Confirm pricing/payments are not in the sidebar.
3. Open **Content** and confirm the GlobalContent editor loads.
4. Open **Build requests** and confirm the queue (or an empty/error state from missing DB keys, not a login redirect).
5. Open **Mapsites** → a row (or empty state). Opening a code should show the Mapsite™ editor, not `/talispros/admin/login`.
6. Open **Talisbooks™** and **Bookshelves**. Confirm shelves link to `/talisbooks` and `/talisbooks/fast/{code}`.
7. Log out. Sign in as Arun with `ARUN`. Confirm “Signed in as Arun” and additional nav (Registrations, Marketing, Associates, …).
8. Confirm `ADMIN123` still signs in to the full console.

Optional: if `MARKETING_MANAGER_EMAILS` is set in the environment, add `remecom@mac.com` and `arun@kyptronix.com` are merged into that allowlist automatically for `/talispros/marketing/admin` (email + password via Supabase). Primary access for this PR is still `/admin/login`.
