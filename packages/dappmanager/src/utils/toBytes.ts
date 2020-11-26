/**
 * Function reuturns bytes. Accepts mb, kb and gb
 */
export function toBytes(amount: number, unit: "kb" | "mb" | "gb"): number {
  switch (unit) {
    case "kb":
      return Math.round(amount * Math.pow(1024, 1));
    case "mb":
      return Math.round(amount * Math.pow(1024, 2));
    case "gb":
      return Math.round(amount * Math.pow(1024, 3));
  }
}
