export default function humanFileSize(size = 0, units = true) {
  if (!size) return 0;
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return parseFloat((size / Math.pow(1024, i)).toFixed(2)) * 1 + (units ? " " + ["B", "kB", "MB", "GB", "TB"][i] : "");
}
