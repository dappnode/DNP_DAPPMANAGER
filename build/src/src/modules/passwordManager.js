const shell = require("utils/shell");

const insecureSalt = "insecur3";

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
 * Checks if the user `dappnode`'s password in the host machine
 * is NOT the insecure default set at installation time.
 * It does so by checking if the current salt is `insecur3`
 *
 * @returns {bool} true = is secure / false = is not
 */
async function isPasswordSecure() {
  const image = await getDappmanagerImage();
  try {
    const res = await shell(
      `${baseCommand} ${image} sh -c "grep dappnode:.*${insecureSalt} /etc/shadow"`
    );
    return !res;
  } catch (e) {
    /**
     * From the man grep page:
     * The exit status is 0 if selected lines are found and 1 otherwise
     * The exit status is 2 if an error occurred
     */
    if (e.code == 1) return true;
    else throw e;
  }
}

/**
 * Changes the user `dappnode`'s password in the host machine
 * Only allows it if the current password is considered insecure
 *
 * @param {string} newPassword = "super-secure-password"
 */
async function changePassword(newPassword) {
  if (!newPassword) throw Error("newPassword must be defined");
  if (typeof newPassword !== "string")
    throw Error("newPassword must be a string");
  if (newPassword.length < 8)
    throw Error("password length must be at least 8 characters");

  if (await isPasswordSecure())
    throw Error(
      "The password can only be changed if it's the insecure default"
    );

  const image = await getDappmanagerImage();
  const res = await shell(
    `${baseCommand} ${image} sh -c "echo dappnode:${newPassword} | chpasswd"`
  );

  // Check the return for success? #### TODO
  return res;
}

module.exports = {
  isPasswordSecure,
  changePassword
};
