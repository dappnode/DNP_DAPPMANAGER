import isIpfsHash from "./isIpfsHash";
import { RequestInterface } from "../types";

export default function isIpfsRequest(req: RequestInterface) {
  if (req && typeof req === "object") {
    return (
      (req.name && isIpfsHash(req.name)) || (req.ver && isIpfsHash(req.ver))
    );
  } else if (req && typeof req === "string") {
    return isIpfsHash(req);
  } else {
    return false;
  }
}
