import { BrainValidatorsResponse, IndicesDiff, ValidatorSnapshot } from "./types.js";

/**
 * Parses the brain validators response into a de-duplicated, sorted array of indices.
 * Normalizes the response by:
 * - Flattening all tag arrays into a single list
 * - Parsing string indices to integers
 * - De-duplicating (union across all tags)
 * - Sorting numerically
 * - Filtering out invalid indices (non-numeric strings, negative numbers)
 *
 * @param response - Response from brain validators API
 * @returns Sorted, de-duplicated array of valid validator indices
 */
export function parseBrainValidatorsResponseToIndices(
  response: BrainValidatorsResponse | null
): { indices: number[]; invalidCount: number } {
  if (!response) {
    return { indices: [], invalidCount: 0 };
  }

  const allIndicesSet = new Set<number>();
  let invalidCount = 0;

  for (const tag of Object.keys(response)) {
    const indexStrings = response[tag];
    if (!Array.isArray(indexStrings)) {
      continue;
    }

    for (const indexStr of indexStrings) {
      const parsed = parseInt(indexStr, 10);

      // Validate: must be a valid non-negative integer
      if (isNaN(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
        invalidCount++;
        continue;
      }

      allIndicesSet.add(parsed);
    }
  }

  // Convert to sorted array
  const indices = Array.from(allIndicesSet).sort((a, b) => a - b);

  return { indices, invalidCount };
}

/**
 * Computes the difference between two sets of indices.
 * Order-insensitive comparison.
 *
 * @param oldIndices - Previous snapshot indices (can be null for first run)
 * @param newIndices - Current indices
 * @returns Diff result with added, removed, and change status
 */
export function diffIndices(
  oldIndices: number[] | null,
  newIndices: number[]
): IndicesDiff {
  const oldSet = new Set(oldIndices ?? []);
  const newSet = new Set(newIndices);

  const added: number[] = [];
  const removed: number[] = [];

  // Find added indices (in new but not in old)
  for (const idx of newIndices) {
    if (!oldSet.has(idx)) {
      added.push(idx);
    }
  }

  // Find removed indices (in old but not in new)
  if (oldIndices) {
    for (const idx of oldIndices) {
      if (!newSet.has(idx)) {
        removed.push(idx);
      }
    }
  }

  // Sort for consistent output
  added.sort((a, b) => a - b);
  removed.sort((a, b) => a - b);

  const hasChanged = added.length > 0 || removed.length > 0;

  return {
    hasChanged,
    added,
    removed,
    oldCount: oldIndices?.length ?? 0,
    newCount: newIndices.length
  };
}

/**
 * Checks if two sorted index arrays are equal (set equality).
 *
 * @param a - First sorted array
 * @param b - Second sorted array
 * @returns True if arrays contain the same elements
 */
export function indicesAreEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Creates a snapshot from an array of indices.
 *
 * @param indices - Sorted, de-duplicated array of indices
 * @returns Snapshot with indices and current timestamp
 */
export function createSnapshot(indices: number[]): ValidatorSnapshot {
  return {
    indices,
    timestamp: Date.now()
  };
}
