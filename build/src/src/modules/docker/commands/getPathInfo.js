const getContainerInstance = require("../lowLevelCommands/getContainerInstance");

const header = "X-Docker-Container-Path-Stat";

/**
 * Get a container path's info
 *
 * @param {string} id "bitcoin.dnp.dappnode.eth"
 * @param {string} pathContainer "/temp/config.json"
 * @returns {object} data = {
 *   name: "/test"
 *   size: 4096,
 *   mode: 2147484141,
 *   mtime: '2019-01-24T08:45:56+01:00',
 *   linkTarget: ''
 * }
 *
 * [NOTE] file mode examples
 * - "demo.txt"      420         file
 * - "/bin/busybox"  796240      file
 * - "/bin/gzip"     134218239   link
 * - "/test"         2147484141  dir
 * - "/bin"          2147484141  dir
 * - "/link"         134218239   link
 */
async function getPathInfo(id, { pathContainer }) {
  const container = await getContainerInstance(id);

  const res = await container.infoArchive({ path: pathContainer });
  // The path info is in a specific header, base64 encoded
  const dataBase64 = res.headers[header] || res.headers[header.toLowerCase()];
  let info;
  try {
    if (!dataBase64) throw Error("No data found on header");
    info = JSON.parse(Buffer.from(dataBase64, "base64").toString("utf8"));
  } catch (e) {
    e.message = `Error parsing path info: ${e.message}`;
    throw e;
  }
  // Parse if path is a directory
  const modeString = String(info.mode);
  info.isDirectory = modeString.length > 6 && modeString.startsWith("2");
  return info;
}

module.exports = getPathInfo;
