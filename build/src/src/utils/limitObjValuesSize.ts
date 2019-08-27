import { mapValues } from "lodash";

export default function limitObjValuesSize(obj: object, maxLen: number) {
  if (!obj || typeof obj !== "object") return obj;
  return mapValues(obj, (value: any) => {
    try {
      const s =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return s.length > maxLen ? s.slice(0, maxLen) : value;
    } catch (e) {
      return value;
    }
  });
}
