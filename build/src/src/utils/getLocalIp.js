const shell = require("./shell");
const isIp = require("is-ip");
const logs = require("../logs.js")(module);

async function getLocalIp({ silent } = {}) {
  try {
    const image = await shell(
      `docker inspect DAppNodeCore-dappmanager.dnp.dappnode.eth -f '{{.Config.Image}}'`,
      { trim: true }
    );
    const output = await shell(
      `docker run --rm --net=host --entrypoint=/sbin/ip ${image} route get 1`,
      { trim: true }
    );
    const internalIp = ((output || "").match(/src\s((\d+\.?){4})/) || [])[1];
    return isIp(internalIp) ? internalIp : null;
  } catch (e) {
    if (!silent) logs.error(`Error getting internal IP: ${e.message}`);
  }
}

module.exports = getLocalIp;
