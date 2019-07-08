const shell = require("utils/shell");

const insecureSalt = "insecur3";

/**
 * The password is set in the pre-seed, only affects ISO-dappnodes
 * https://github.com/dappnode/DAppNode_Installer/blob/472d046f2661d737c4650a1f895c8c4d89234cd8/build/dappnode/scripts/preseed_unattended.cfg#L12
 * `d-i passwd/user-password-crypted password $6$insecur3$rnEv9Amdjn3ctXxPYOlzj/cwvLT43GjWzkPECIHNqd8Vvza5bMG8QqMwEIBKYqnj609D.4ngi4qlmt29dLE.71`
 *
 * The file `/etc/shadow` contains:
 * - with the original salt and password
 * `dappnode:$6$insecur3$rnEv9Amdjn3ctXxPYOlzj/cwvLT43GjWzkPECIHNqd8Vvza5bMG8QqMwEIBKYqnj609D.4ngi4qlmt29dLE.71:18004:0:99999:7:::`
 *
 * - with different salt and passwords
 * `dappnode:$6$3xJOPS06irY5D3oU$K6xksTew8J6B8Nv4DsNFMWlaIbs8oGlZpjKi3RqTpwUZYUksv.D73l.z//E3anyVxuwiLzKjbc2zn0OZ7H3ee0:18081:0:99999:7:::`
 * `dappnode:$6$jdm67MNg/pPBTmeF$IGVHSkfA0IahdgXkhqd5m5iQEc0rzRALd38Pp7QL89YPQnfaCnCPSkOLi0WCu.XCcQi9FCF.xZ8.p2BzQgAXv.:18081:0:99999:7:::`
 *
 * Commands
 * - To check if the password is still the same
 * `docker run --rm -v /etc:/etc --privileged --entrypoint="" dappmanager.dnp.dappnode.eth:0.2.5 sh -c "grep dappnode:.*insecur3 /etc/shadow"`
 *   This command will return a line of text if the password is insecure, or an empty string otherwise
 * - To change the password
 * `docker run --rm -v /etc:/etc --privileged --entrypoint="" dappmanager.dnp.dappnode.eth:0.2.5 sh -c "echo dappnode:newpassword | chpasswd"`
 *   The new password is provided after `dappnode:` in this case it's `newpassword`
 *   This command will return `chpasswd: password for 'dappnode' changed` if all went well
 *   image = "dappmanager.dnp.dappnode.eth:0.2.5" (or whatever the last version is)
 *
 */

const baseCommand = `docker run --rm -v /etc:/etc --privileged --entrypoint=""`;

// If the DAPPMANAGER image changes, this node app MUST be reseted
let cacheDappmanagerImage;
async function getDappmanagerImage() {
  if (cacheDappmanagerImage) return cacheDappmanagerImage;
  const res = await shell(
    `docker ps --filter "name=dappmanager.dnp.dappnode.eth" --format "{{.Image}}"`
  );
  if (!res) throw Error("No image found for dappmanager.dnp.dappnode.eth");
  const dappmanagerImage = res.trim();
  cacheDappmanagerImage = dappmanagerImage;
  return dappmanagerImage;
}

/**
 * Checks if the SSH password of the host for the user `dappnode`
 * is NOT the insecure default set at installation time.
 * It does so by checking if the current salt is `insecur3`
 *
 * @returns {bool} true = is secure / false = is not
 */
async function isSshPasswordSecure() {
  const image = await getDappmanagerImage();
  const res = await shell(
    `${baseCommand} ${image} sh -c "grep dappnode:.*${insecureSalt} /etc/shadow"`
  );
  return !res;
}

/**
 * Changes the SSH password of the host for the user `dappnode`
 * Only allows it if the current password has the salt `insecur3`
 *
 * @param {string} newPassword super-secure-password
 */
async function changeSshPassword(newPassword) {
  if (!newPassword) throw Error("newPassword must be defined");

  if (await isSshPasswordSecure())
    throw Error(
      "The SSH password can only be changed if it's the insecure default"
    );

  const image = await getDappmanagerImage();
  const res = await shell(
    `${baseCommand} ${image} sh -c "echo dappnode:${newPassword} | chpasswd"`
  );

  // Check the return for success? #### TODO
  return res;
}

module.exports = {
  isSshPasswordSecure,
  changeSshPassword
};
