import { DirectoryItem } from "types";
import { SelectedCategories } from "../types";

/**
 * Filters directory by:
 * 1. Search bar. If search bar is empty, return all
 * 2. Selected types: If no types selected, return all
 *
 * @param directory = [{
 *   name: "bitcoin.dnp.dappnode.eth",
 *   version: "0.1.0",
 *   manifest: <manifestObj>,
 *   whitelisted: true
 * }, ... ]
 * @param query = "bitco"
 * @param selectedCategories = { library: false, service: true }
 * @returns some elements of directory
 * [Tested]
 */
export default function filterDirectory({
  directory,
  query,
  selectedCategories
}: {
  directory: DirectoryItem[];
  query: string;
  selectedCategories: SelectedCategories;
}): DirectoryItem[] {
  const isSomeCategorySelected = Object.values(selectedCategories).reduce(
    (acc, val) => acc || val,
    false
  );
  return directory
    .filter(dnp => !query || includesSafe(dnp, query))
    .filter(
      dnp =>
        !isSomeCategorySelected ||
        (dnp.status === "ok" &&
          (dnp.categories || []).some(category => selectedCategories[category]))
    );
}

/**
 * Tests inclusion of a string in an object.
 * In case of error, returns true
 *
 * @param {object} sourceObj = { hello: "world" }
 * @param {string} target = "hell"
 * @returns {Boolean} = true
 * [Tested]
 */
function includesSafe(sourceObj: any, target: string): boolean {
  try {
    return JSON.stringify(sourceObj).includes(target);
  } catch (e) {
    console.error(`Error on includesSafe: ${e.stack}`);
    return true;
  }
}
