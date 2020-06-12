import { maxIdLength } from "../data";

export default function coerceDeviceName(name = "") {
  // Replace non-alphanumeric characters
  name = name.replace(/\W/g, "");

  // Limit device length
  if (name.length > maxIdLength) name = name.slice(0, maxIdLength);

  return name;
}
