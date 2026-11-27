/** Samples older than this are dropped from the rate */
const RATE_WINDOW_MS = 15 * 60 * 1000;
/** A rate needs samples at least this far apart */
const MIN_RATE_SPAN_MS = 60 * 1000;
/** Some clients report progress in batches minutes apart, so no movement counts as stalled only after this */
const STALL_AFTER_MS = 5 * 60 * 1000;

type Sample = { timeMs: number; value: number };
type Series = { phase: string; baseline: number; samples: Sample[] };

export type ProgressObservation = {
  /** First value seen in this phase: where the progress bar starts */
  baseline: number;
  /** Change per second over the recent window, or null until there are enough samples */
  ratePerSecond: number | null;
  /** True if the value has not moved for at least STALL_AFTER_MS */
  isStalled: boolean;
};

/**
 * Remembers how a client's sync position moves between polls, so progress can be measured from where
 * the sync was first seen and the time left estimated. State is in memory and restarts with dappmanager.
 */
export class ProgressTracker {
  private readonly series = new Map<string, Series>();

  observe(key: string, phase: string, value: number, nowMs: number): ProgressObservation {
    let series = this.series.get(key);
    if (!series || series.phase !== phase || value < series.baseline) {
      series = { phase, baseline: value, samples: [] };
      this.series.set(key, series);
    }
    series.samples = series.samples.filter((s) => nowMs - s.timeMs <= RATE_WINDOW_MS);
    series.samples.push({ timeMs: nowMs, value });

    const oldest = series.samples[0];
    const span = nowMs - oldest.timeMs;
    const ratePerSecond = span >= MIN_RATE_SPAN_MS ? ((value - oldest.value) / span) * 1000 : null;
    return { baseline: series.baseline, ratePerSecond, isStalled: span >= STALL_AFTER_MS && value <= oldest.value };
  }

  /** Forgets a client's series, e.g. once it reaches the head */
  reset(key: string): void {
    this.series.delete(key);
  }
}

export const progressTracker = new ProgressTracker();
