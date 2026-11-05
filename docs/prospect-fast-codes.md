# Prospect FAST Codes

Prospect (queue) FAST Codes are always based on the **decision maker’s first and last name initials** (e.g. Ralf Meyer → `rm01`, Hermance Mercure Laplante → `hml01`). They are never generated from brokerage-name words.

- Without a decision-maker name, `proposed_code` stays null and the admin queue shows **Code pending: decision maker name needed** (DE: **Code ausstehend: Name des Entscheiders fehlt**).
- Approving a queue row without a name is blocked until first and last name are saved (inline edit or CSV import).
- Built / issued Mapsite codes are never changed by queue imports; CSV import only fills empty phone/email/position fields on existing Lead CRM rows and lists name mismatches.
- Generator: `proposeFastCode` / `proposeFastCodeFromParts` in `lib/talispros/fast-code-tracker.ts`, reusing `extractInitials` from `validators/fast-code.validator.ts`.
