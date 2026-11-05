# Admin TalisBOT™ messages — contract (TalisBOT + Tsplits Lead Sourcing)

Audience: **Ralf** on `/admin/dashboard` (card + history). Dismiss sets `read_at` only — **never delete**. EN + DE copy lives in `metadata.i18n`; the card addresses Ralf by name.

## Tables

### `public.admin_talisbot_messages`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `type` | text | `progress` \| `result` \| `assigned` \| `needs_review` \| `reply` |
| `title` | text | EN default (1–200) |
| `body` | text | EN default (1–4000) |
| `fast_code` | text nullable | lowercase when set; dashboard link |
| `brokerage` | text nullable | link when no code yet |
| `prospect_queue_id` | uuid nullable | FK → `prospect_queue` |
| `metadata` | jsonb | free-form; include `i18n: { en:{title,body}, de:{title,body} }` |
| `created_by` | text | `talisbot` \| `tsplits-sourcing` \| `admin:…` |
| `parent_id` | uuid nullable | optional parent **message** for UI threading |
| `reply_to_comment_id` | uuid nullable | when answering an `admin_talisbot_comments` row |
| `read_at` | timestamptz nullable | dismiss |
| `created_at` | timestamptz | |

**Threading rule:** Sourcing-bot answers to Ralf’s comments use `type='reply'` + **`reply_to_comment_id`**. `parent_id` is only for message→message UI threads.

### `public.admin_talisbot_comments`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `message_id` | uuid nullable | FK → message; null = general “Message TalisBOT™” |
| `body` | text | 1–4000 |
| `author` | text | e.g. `Ralf Meyer` |
| `created_at` | timestamptz | |
| `status` | text | `new` \| `seen` \| `answered` |
| `answered_at` | timestamptz nullable | set when answered |

## Message `type`

| type | When |
|------|------|
| `progress` | Daily job / Run now **starts** (lists towns being searched) |
| `result` | Daily job / Run now **ends** (count + markets); also CSV import / contact edits (decision makers / codes ready) |
| `assigned` | Approval assignment (codes → Aritri / Enanko) |
| `needs_review` | Dual decision-makers, regional firms, anything outside the small-independent brief — **highlighted** |
| `reply` | Answer to a comment (`reply_to_comment_id`) or message thread (`parent_id`) |

## Auto messages (platform)

- **Run start:** `progress` — “Hi Ralf…” / “Hallo Ralf…” with towns.  
- **Run end:** `result` — added count + markets.  
- **Assignments:** `assigned` — `CODE → Agent (Brokerage)`.  
- **CSV import / contact save:** `result` — decision makers found; codes ready or pending.  
- While `fast_code_job_runs.finished_at` is null (and started &lt; 30 min ago), the dashboard shows the animated **“TalisBOT™ is searching…”** state.

## Tsplits Lead Sourcing — allowed writes only

Service role only. **No deletes.**

1. **Read** comments:  
   `select * from admin_talisbot_comments where status = 'new' order by created_at;`
2. **Reply** to a comment (and optionally mark seen first):  
   ```ts
   await supabase.from("admin_talisbot_messages").insert({
     type: "reply",
     title: "…",
     body: "…", // address Ralf; put DE in metadata.i18n.de
     reply_to_comment_id: comment.id,
     parent_id: comment.message_id, // optional UI thread
     created_by: "tsplits-sourcing",
     metadata: { i18n: { en: { title, body }, de: { title, body } } },
   });
   await supabase.from("admin_talisbot_comments")
     .update({ status: "answered", answered_at: new Date().toISOString() })
     .eq("id", comment.id);
   ```
3. **May also insert** `needs_review` (and `progress` / `result` if it runs its own search cards).  

Those are the sourcing bot’s **only** writes to these tables.

## Admin UI

- Card on `/admin/dashboard` addresses Ralf (EN/DE).  
- History: newest first, grouped by IST date, date filter (`?talisbotDay=YYYY-MM-DD`).  
- Dismiss → `read_at`.  
- Comment under any message, or general **Message TalisBOT™** box (`message_id` null).  
- Preview seed (screenshots only, no DB writes): `?talisbotPreview=searching|done|history`.
