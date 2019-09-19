import { mapValues } from "lodash";

export default function limitObjValuesSize(
  obj: { [key: string]: object | string },
  maxLen: number
): { [key: string]: object | string } {
  if (!obj || typeof obj !== "object") return obj;
  return mapValues(obj, (value: object | string) => {
    try {
      const s =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return s.length > maxLen ? s.slice(0, maxLen) : value;
    } catch (e) {
      return value;
    }
  });
}
