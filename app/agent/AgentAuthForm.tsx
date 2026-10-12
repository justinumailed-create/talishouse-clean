"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type InputHTMLAttributes } from "react";
import { agentChangePasswordAction, agentLoginAction } from "./actions";

const fieldClass =
  "block h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition focus:border-[#1E4ED8] focus:outline-none focus:ring-4 focus:ring-[#1E4ED8]/15 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/15";

const primaryButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E4ED8] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition hover:bg-[#1a43bd] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4ED8]/30 disabled:cursor-not-allowed disabled:opacity-70";

/** Lockout / throttle responses get one friendly, consistent message. */
function friendlyLoginError(message: string): string {
  if (/too many|locked|lockout|try again later/i.test(message)) {
    return "Too many attempts, try again in 15 minutes.";
  }
  return message;
}

function Spinner() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ErrorBanner({ id, message }: { id: string; message: string | null }) {
  return (
    <div id={id} role="alert" aria-live="assertive" aria-atomic="true">
      {message ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
          <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4.75a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75ZM10 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-neutral-800">{label}</label>
        {hint}
      </div>
      {children}
    </div>
  );
}

function PasswordInput(props: InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${fieldClass} pr-16`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-controls={props.id}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-1.5 right-1.5 rounded-lg px-2.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4ED8]/40"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function AgentLoginForm() {
  const router = useRouter();
  const ids = useId();
  const errorId = `${ids}-error`;
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      noValidate
      aria-describedby={errorId}
      onSubmit={(e) => {
        e.preventDefault();
        if (!loginId.trim() || !password) {
          setError("Enter your login ID and password.");
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await agentLoginAction(loginId, password);
          if (!result.ok) {
            setError(friendlyLoginError(result.error));
            setPassword("");
            return;
          }
          router.replace(result.next);
          router.refresh();
        });
      }}
    >
      <ErrorBanner id={errorId} message={error} />
      <div className="space-y-5">
        <Field label="Login ID" id={`${ids}-login`}>
          <input
            id={`${ids}-login`}
            name="username"
            className={fieldClass}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            aria-invalid={Boolean(error)}
            required
            autoFocus
          />
        </Field>
        <Field label="Password" id={`${ids}-password`}>
          <PasswordInput
            id={`${ids}-password`}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(error)}
            required
          />
        </Field>
      </div>
      <button type="submit" disabled={pending} aria-busy={pending} className={`${primaryButton} mt-7`}>
        {pending ? (<><Spinner /> Signing in…</>) : "Sign in"}
      </button>
      <p className="mt-5 text-center text-sm text-neutral-500">
        Forgot password? <span className="text-neutral-700">Contact your administrator.</span>
      </p>
    </form>
  );
}

const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 12 characters", test: (v) => v.length >= 12 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
];

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 text-[13px] transition-colors ${ok ? "text-green-700" : "text-neutral-500"}`}>
      <span aria-hidden className={`flex h-4 w-4 items-center justify-center rounded-full ${ok ? "bg-green-600 text-white" : "border border-neutral-300"}`}>
        {ok ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 6.5l2.2 2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : null}
      </span>
      <span>{label}</span>
      <span className="sr-only">{ok ? "met" : "not met"}</span>
    </li>
  );
}

export function AgentChangePasswordForm() {
  const router = useRouter();
  const ids = useId();
  const errorId = `${ids}-error`;
  const rulesId = `${ids}-rules`;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const results = PASSWORD_RULES.map((rule) => rule.test(next));
  const metCount = results.filter(Boolean).length;
  const strong = metCount === PASSWORD_RULES.length;
  const matches = confirm.length > 0 && confirm === next;
  const strengthColor = ["bg-neutral-200", "bg-red-500", "bg-amber-500", "bg-amber-500", "bg-green-600"][metCount];

  return (
    <form
      noValidate
      aria-describedby={errorId}
      onSubmit={(e) => {
        e.preventDefault();
        if (!current) return setError("Enter your current (temporary) password.");
        if (!strong) return setError("Your new password doesn’t meet all the requirements yet.");
        if (next !== confirm) return setError("New passwords do not match.");
        setError(null);
        startTransition(async () => {
          const result = await agentChangePasswordAction(current, next);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.replace(result.next);
          router.refresh();
        });
      }}
    >
      <ErrorBanner id={errorId} message={error} />
      <div className="space-y-5">
        <Field label="Current password" id={`${ids}-current`}>
          <PasswordInput id={`${ids}-current`} name="current-password" autoComplete="current-password"
            value={current} onChange={(e) => setCurrent(e.target.value)} required autoFocus />
        </Field>
        <Field label="New password" id={`${ids}-new`}>
          <PasswordInput id={`${ids}-new`} name="new-password" autoComplete="new-password"
            value={next} onChange={(e) => setNext(e.target.value)} aria-describedby={rulesId} required />
          <div className="mt-3 flex gap-1" aria-hidden>
            {PASSWORD_RULES.map((rule, i) => (
              <span key={rule.label} className={`h-1 flex-1 rounded-full transition-colors ${i < metCount ? strengthColor : "bg-neutral-200"}`} />
            ))}
          </div>
          <ul id={rulesId} aria-live="polite" className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {PASSWORD_RULES.map((rule, i) => (
              <RuleItem key={rule.label} ok={results[i]} label={rule.label} />
            ))}
          </ul>
        </Field>
        <Field
          label="Confirm new password"
          id={`${ids}-confirm`}
          hint={
            confirm.length > 0 ? (
              <span aria-live="polite" className={`text-xs font-medium ${matches ? "text-green-700" : "text-red-600"}`}>
                {matches ? "Passwords match" : "Doesn’t match"}
              </span>
            ) : null
          }
        >
          <PasswordInput id={`${ids}-confirm`} name="confirm-password" autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={confirm.length > 0 && !matches} required />
        </Field>
      </div>
      <button type="submit" disabled={pending} aria-busy={pending} className={`${primaryButton} mt-7`}>
        {pending ? (<><Spinner /> Saving…</>) : "Update password"}
      </button>
    </form>
  );
}
