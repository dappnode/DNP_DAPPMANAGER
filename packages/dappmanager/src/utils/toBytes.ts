import { ToBytes } from "../types";

/**
 * Function reuturns bytes. Accepts mb, kb and gb
 * @param param0
 */
export function toBytes({
  amount,
  option
}: {
  amount: number;
  option: ToBytes;
}): number {
  const constant = 1024;

  switch (option.meassure) {
    case "kb":
      return Math.round(amount * Math.pow(constant, 1));
    case "mb":
      return Math.round(amount * Math.pow(constant, 2));
    case "gb":
      return Math.round(amount * Math.pow(constant, 3));
  }
}
