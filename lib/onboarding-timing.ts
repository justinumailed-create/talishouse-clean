/**
 * Pipeline timing + timeout helpers for onboarding reliability.
 * Logs wall-clock durations; flags ⚠ SLOW (≥5s) and ❌ CRITICAL (≥30s).
 */

export const ONBOARDING_SLOW_MS = 5_000;
export const ONBOARDING_CRITICAL_MS = 30_000;

/** Default ceiling for a single long ebook-generation job. */
export const ONBOARDING_JOB_TIMEOUT_MS = 55_000;

export type OnboardingFailureReport = {
  requestId: string | null;
  fastCode: string | null;
  mapsiteId: string | null;
  stage: string;
  error: string;
  durationMs: number;
};

export class OnboardingTimeoutError extends Error {
  readonly stage: string;
  readonly timeoutMs: number;

  constructor(stage: string, timeoutMs: number) {
    super(
      `${stage} timed out after ${formatOnboardingDuration(timeoutMs)}. Please try again.`
    );
    this.name = "OnboardingTimeoutError";
    this.stage = stage;
    this.timeoutMs = timeoutMs;
  }
}

export function onboardingNow(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export function formatOnboardingDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(ms >= 10_000 ? 1 : 2)} s`;
  }
  return `${Math.round(ms)} ms`;
}

function severitySuffix(elapsed: number): string {
  if (elapsed >= ONBOARDING_CRITICAL_MS) return " ❌ CRITICAL";
  if (elapsed >= ONBOARDING_SLOW_MS) return " ⚠ SLOW";
  return "";
}

/**
 * Log a named onboarding step duration.
 * Example: `[onboarding] FAST generation .......... 35 ms`
 */
export function logOnboardingStep(
  step: string,
  startedAt: number,
  extra?: Record<string, unknown>
): number {
  const elapsed = onboardingNow() - startedAt;
  const label = step.padEnd(24, ".");
  const duration = formatOnboardingDuration(elapsed).padStart(8, " ");
  const detail =
    extra && Object.keys(extra).length > 0
      ? ` ${JSON.stringify(extra)}`
      : "";
  console.info(
    `[onboarding] ${label} ${duration}${severitySuffix(elapsed)}${detail}`
  );
  return elapsed;
}

export function logOnboardingFailure(report: OnboardingFailureReport): void {
  console.error("[onboarding] FAILURE", {
    requestId: report.requestId,
    fastCode: report.fastCode,
    mapsiteId: report.mapsiteId,
    stage: report.stage,
    error: report.error,
    duration: formatOnboardingDuration(report.durationMs),
    durationMs: report.durationMs,
  });
}

export async function timedOnboardingStep<T>(
  step: string,
  fn: () => Promise<T>,
  extra?: Record<string, unknown>
): Promise<T> {
  const started = onboardingNow();
  try {
    const result = await fn();
    logOnboardingStep(step, started, extra);
    return result;
  } catch (error) {
    logOnboardingStep(step, started, {
      ...extra,
      failed: true,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Race an async operation against an explicit timeout.
 * Never leaves the caller waiting indefinitely.
 */
export async function withOnboardingTimeout<T>(
  stage: string,
  timeoutMs: number,
  fn: () => Promise<T>
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new OnboardingTimeoutError(stage, timeoutMs));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
