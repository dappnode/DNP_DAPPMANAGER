import isIp from "is-ip";
import { shell } from "@dappnode/utils";
import { getDappmanagerImage } from "@dappnode/dockerapi";

export async function getInternalIp(): Promise<string> {
  try {
    const image = await getDappmanagerImage();
    const output = await shell(`docker run --rm --net=host --entrypoint=/sbin/ip ${image} route get 1`);
    // A unicode escape sequence is basically atomic. You cannot really build one dynamically
    // Template literals basically perform string concatenation, so your code is equivalent to
    // FROM: 1.0.0.0 via 104.248.144.1 dev eth0 src 104.248.150.201 uid 0
    // TO: 104.248.150.201
    const internalIp = ((output || "").match(/src\s((\d+\.?){4})/) || [])[1];

    if (!isIp(internalIp)) throw Error(`Invalid IP: ${internalIp}`);

    return internalIp;
  } catch (e) {
    e.message = `Error getting internal IP: ${e.message}`;
    throw e;
  }
}
