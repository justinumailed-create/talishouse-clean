# Talispros™ /admin access — Ralf SUPERADMIN & Arun

Login uses the existing FAST-code admin session (`hasAdminSession` / `admin_session` cookie). There is no separate console.

## Login

**URL:** `/admin/login`  
Production example: `https://talispros.com/admin/login` (or the current Vercel host).

Enter the FAST code and continue. Codes are case-insensitive.

| Person | Email | FAST code | Access |
|--------|-------|-----------|--------|
| Ralf | `remecom@mac.com` | `rm22` | SUPERADMIN: Platform Content (Marketing Admin), Mapsites, FAST Codes, Talisbooks / custom ebook editor |
| Arun | `arun@kyptronix.com` | `ARUN` | Full `/admin` console |
| Platform | — | `ADMIN123` | Full `/admin` console (existing) |

There is no password on this screen. The FAST code *is* the credential, matching the existing admin auth.

Arun was not given a customer FAST code, so `ARUN` is the admin login code. Ralf’s `rm22` is also his live Root Mapsite™ code; using it at `/admin/login` opens admin. Entering `rm22` on a Mapsite™ / business-office gate does **not** grant admin (only `ADMIN123` still does there).

## What each person can edit

After login, the sidebar lists the tools below. Ralf sees SUPERADMIN product tools (not pricing, payments, or user CRM). Arun sees those plus the rest of the existing console. Authorization is enforced server-side (middleware + page/action checks), not only by hiding nav.

| Nav item | Path | What you can do |
|----------|------|-----------------|
| Platform Content | `/admin/platform-content` | Existing Marketing Admin: registrations, listing text/images, demo Mapsites™, client metrics. Also links to product images and Mapsite™ listings. |
| Marketing Admin | `/talispros/marketing/admin` | Same Marketing Admin APIs; FAST-code SUPERADMIN/full session is accepted (no second login). |
| Content | `/admin/content` | Thin GlobalContent homepage hero titles only |
| Build requests | `/admin/build-requests` | See submissions and act (assign FAST code, generate Mapsite™, send registration, reject). Detail/edit at `/admin/marketing/[id]` |
| Mapsites | `/admin/mapsites` | List Mapsites™; open one to edit listing text, images/media, pin, lifecycle, and the custom ebook editor (`#ebook-editor`) |
| FAST Codes | `/admin/fast-codes` | Search, view, create/assign, and edit existing FAST Codes. Does not change Build My MapSite / ebook-generate generators. |
| Talisbooks™ | `/admin/talisbooks` | Book metadata plus a path to the **custom ebook editor** (Mapsite™ panel + viewer Live Edit). Front Cover / Back Cover stay explicit assignments; landscape = one two-page spread. |
| Bookshelves | `/admin/talisbooks/bookshelves` | Public library + per-Mapsite™ TEB™ shelves, with ebook-editor links |

Payment-driven Mapsite™ activation is unchanged. SUPERADMIN can edit listings; unpaid Mapsites™ still follow the existing activation rules for owners.

## Verify steps

1. Open `/admin/login` while logged out. Confirm the FAST code field is shown.
2. Sign in as Ralf with `rm22`. Confirm the sidebar shows **Platform Content**, **FAST Codes**, **Content**, **Build requests**, **Mapsites**, **Talisbooks™**, **Bookshelves**, and “Signed in as Ralf”. Confirm pricing/payments/users are not in the sidebar.
3. Open **Platform Content**. Confirm the Marketing Admin queue (registrations / listing content) loads — not only GlobalContent hero titles. Open Marketing Admin / Demo Mapsites™ / clients from the cards. Direct `/talispros/marketing/admin` should stay signed in (FAST session), not bounce to the marketing email/password login.
4. Open **FAST Codes**. Confirm search/list (or an empty/error state from missing DB keys, not a login redirect). Create/edit remain the existing admin actions.
5. Open **Mapsites** → a row (or empty state). Opening a code should show the Mapsite™ editor and **Custom ebook editor** (`#ebook-editor`), not `/talispros/admin/login`.
6. Open **Talisbooks™**. Confirm the Custom ebook editor list with “Open ebook editor” and “Viewer Live Edit” when a book exists. Front Cover / Back Cover remain explicit; do not split Page 1 as a cover.
7. Open a viewer book while signed in as Ralf and confirm Live Edit is available (SUPERADMIN bypass). Non-admins still cannot edit.
8. Try `/admin/pricing` or `/admin/payments` while signed in as Ralf — should redirect to `/admin/dashboard`.
9. Log out. Sign in as Arun with `ARUN`. Confirm “Signed in as Arun” and additional nav (Registrations, Marketing, Associates, …).
10. Confirm `ADMIN123` still signs in to the full console.

Optional: if `MARKETING_MANAGER_EMAILS` is set in the environment, `remecom@mac.com` and `arun@kyptronix.com` are still merged into that allowlist for the email + password marketing session. Primary access is `/admin/login` with FAST codes.
