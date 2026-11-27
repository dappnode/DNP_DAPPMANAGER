export type MetricSample = { name: string; labels: Record<string, string>; value: number };

const SAMPLE_LINE = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+(\S+)/;
const LABEL = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g;

/** Parses the Prometheus text format. Accepts the trailing comma some clients write after the last label */
export function parsePrometheus(text: string): MetricSample[] {
  const samples: MetricSample[] = [];
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const match = SAMPLE_LINE.exec(line.trim());
    if (!match) continue;
    const value = parseFloat(match[3]);
    if (!Number.isFinite(value)) continue;
    const labels: Record<string, string> = {};
    for (const [, key, labelValue] of (match[2] ?? "").matchAll(LABEL)) labels[key] = labelValue;
    samples.push({ name: match[1], labels, value });
  }
  return samples;
}

/** Value of the first sample with this name whose labels include `labels`, or null if there is none */
export function findMetric(
  samples: MetricSample[] | null,
  name: string,
  labels: Record<string, string> = {}
): number | null {
  if (!samples) return null;
  const sample = samples.find(
    (s) => s.name === name && Object.entries(labels).every(([key, value]) => s.labels[key] === value)
  );
  return sample ? sample.value : null;
}
