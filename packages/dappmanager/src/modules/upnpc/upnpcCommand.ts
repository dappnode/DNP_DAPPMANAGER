import shell from "../../utils/shell";
import getDappmanagerImage from "../../utils/getDappmanagerImage";
import { UpnpError } from "./upnpError";

export default async function upnpcCommand(cmd: string): Promise<string> {
  try {
    const image = await getDappmanagerImage();
    return await shell(
      `docker run --rm --net=host --entrypoint=/usr/bin/upnpc ${image} ${cmd}`
    );
  } catch (e) {
    throw new UpnpError({ terminalOutput: e.message, command: cmd });
  }
}
