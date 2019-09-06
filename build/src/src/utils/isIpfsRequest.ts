import isIpfsHash from "./isIpfsHash";
import { PackageRequest } from "../types";

export default function isIpfsRequest(req: PackageRequest): boolean {
  if (req && typeof req === "object") {
    return Boolean(
      (req.name && isIpfsHash(req.name)) || (req.ver && isIpfsHash(req.ver))
    );
  } else if (req && typeof req === "string") {
    return isIpfsHash(req);
  } else {
    return false;
  }
}
