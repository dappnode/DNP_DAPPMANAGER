import { InstalledPackageDataApiReturn, DirectoryItemOk } from "@dappnode/types";

/* ── Filter configuration ───────────────────────────────────────────── */

/**
 * Describes how to filter packages for a given section (AI, Staking, etc.).
 *
 * - `include` keeps only packages whose categories include at least one of the listed values.
 * - `exclude` keeps packages that do NOT have any of the listed categories.
 *
 * Exactly one of `include` or `exclude` should be set.
 */
export type CategoryFilter = { mode: "include"; categories: string[] } | { mode: "exclude"; categories: string[] };

/** Configuration that each section passes to the shared Packages / Store pages. */
export interface PackagesConfig {
  /** Human-readable section label, e.g. "AI", "Staking" */
  sectionLabel: string;
  /** Category filter applied to directory items and installed packages */
  categoryFilter: CategoryFilter;
  /** Absolute path to the packages list page, e.g. "/ai/packages" */
  packagesPath: string;
  /** Absolute path to the store page, e.g. "/ai/store" */
  storePath: string;
  /** Absolute path prefix for the installer, e.g. "/installer" */
  installerPath: string;
}

/* ── Filter helpers ─────────────────────────────────────────────────── */

/** Returns true if the directory item passes the category filter. */
export function matchesDirectoryFilter(item: DirectoryItemOk, filter: CategoryFilter): boolean {
  if (filter.mode === "include") {
    return filter.categories.some((cat) => item.categories.includes(cat));
  }
  return !filter.categories.some((cat) => item.categories.includes(cat));
}

/** Returns true if the installed package passes the category filter. */
export function matchesInstalledFilter(pkg: InstalledPackageDataApiReturn, filter: CategoryFilter): boolean {
  const cats = pkg.categories ?? [];
  if (filter.mode === "include") {
    return filter.categories.some((cat) => cats.includes(cat));
  }
  return !filter.categories.some((cat) => cats.includes(cat));
}
