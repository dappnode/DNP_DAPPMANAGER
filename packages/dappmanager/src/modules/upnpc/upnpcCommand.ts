import shell from "../../utils/shell";
import parseGeneralErrors from "./parseGeneralErrors";
import getDappmanagerImage from "../../utils/getDappmanagerImage";

export default async function upnpcCommand(cmd: string): Promise<string> {
  try {
    const image = await getDappmanagerImage();
    return await shell(
      `docker run --rm --net=host --entrypoint=/usr/bin/upnpc ${image} ${cmd}`
    );
  } catch (e) {
    parseGeneralErrors(e.message);
    throw e;
  }
}
