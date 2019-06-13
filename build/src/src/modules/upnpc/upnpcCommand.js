const shell = require("utils/shell");
const parseGeneralErrors = require("./parseGeneralErrors");

async function upnpcCommand(cmd) {
  try {
    const image = await shell(
      `docker inspect DAppNodeCore-dappmanager.dnp.dappnode.eth -f '{{.Config.Image}}'`,
      { trim: true }
    );
    return await shell(
      `docker run --rm --net=host --entrypoint=/usr/bin/upnpc ${image} ${cmd}`
    );
  } catch (e) {
    parseGeneralErrors(e.message);
    throw e;
  }
}

module.exports = upnpcCommand;
