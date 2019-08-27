import shell from "../../utils/shell";
import parseGeneralErrors from "./parseGeneralErrors";

export default async function upnpcCommand(cmd: string) {
  try {
    const image = await shell(
      `docker inspect DAppNodeCore-dappmanager.dnp.dappnode.eth -f '{{.Config.Image}}'`
    );
    return await shell(
      `docker run --rm --net=host --entrypoint=/usr/bin/upnpc ${image} ${cmd}`
    );
  } catch (e) {
    parseGeneralErrors(e.message);
    throw e;
  }
}
