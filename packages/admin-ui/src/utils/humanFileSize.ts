/**
 * Convert a file size in bytes to a human-readable string.
 * @param size The file size in bytes.
 * @param units Whether to include the units in the output string. Default is true.
 * @param decimalDigits The number of decimal digits to include in the output string. Default is 2.
 * @returns A human-readable string representing the file size, or 0 if the size is 0 or not provided.
 */

export default function humanFileSize(size = 0, units = true, decimalDigits = 2): string | number {
  if (!size) return 0;
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    parseFloat((size / Math.pow(1024, i)).toFixed(decimalDigits)) * 1 +
    (units ? " " + ["B", "kB", "MB", "GB", "TB"][i] : "")
  );
}
