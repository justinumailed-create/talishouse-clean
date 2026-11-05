# Admin TalisBOT™ messages — insert contract

Table: `public.admin_talisbot_messages`  
Audience: Ralf on `/admin/dashboard` (full history; filter by day). Dismiss marks `read_at`; rows are never deleted. Ralf can reply; replies use `type = 'reply'` and `parent_id`.

## Message `type` (required)

| type | Meaning |
|------|---------|
| `progress` | In-progress update from a run |
| `result` | Finished result summary |
| `assigned` | A prospect/code was assigned |
| `needs_review` | **Needs your review** — highlighted on the dashboard; hold action until Ralf decides |
| `reply` | Human (Ralf) or bot reply in a thread (`parent_id` set) |

## Insert (service role)

Allowed callers: TalisBOT™, Tsplits Lead Sourcing, other trusted server jobs with the service role. Do **not** expose inserts to anon/authenticated clients.

```ts
await supabase.from("admin_talisbot_messages").insert({
  type: "needs_review", // progress | result | assigned | needs_review | reply
  title: "Short headline",
  body: "Helpful detail for Ralf (EN).",
  fast_code: "pp03", // optional, lowercase; link on dashboard
  brokerage: "Macdonald Realty Squamish", // optional; used when no code yet
  prospect_queue_id: "<uuid>", // optional
  metadata: { /* free-form: markets, reason codes, etc. */ },
  created_by: "tsplits-sourcing", // or "talisbot"
  parent_id: null, // set when type === "reply"
});
```

### Field rules

- `title`: 1–200 chars  
- `body`: 1–4000 chars  
- `fast_code`: lowercase when present  
- `needs_review`: always set `fast_code` **or** `brokerage` (or both) so the dashboard can deep-link  
- Never `DELETE` rows; only `UPDATE … SET read_at = now()` to dismiss  

### Dashboard behaviour

- `needs_review` messages render with a highlighted amber style and a “Needs your review” badge.  
- Linked FAST Code opens the tracker / Mapsite path; brokerage-only rows point at the prospect queue.  
- Tsplits Lead Sourcing should insert `needs_review` for dual decision-makers, franchise/regional edge cases, and anything outside the small-independent brief, and check for Ralf `reply` rows at the start of each run.
