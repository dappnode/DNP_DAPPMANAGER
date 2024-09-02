import { shell } from "@dappnode/utils";
import { getDappmanagerImage } from "@dappnode/dockerapi";
import { parseUpnpErrors } from "./upnpError.js";

export default async function upnpcCommand(cmd: string): Promise<string> {
  try {
    const image = await getDappmanagerImage();
    return await shell(`docker run --rm --net=host --entrypoint=/usr/bin/upnpc ${image} ${cmd}`);
  } catch (e) {
    const upnpError = parseUpnpErrors(e.message);
    throw upnpError;
  }
}
