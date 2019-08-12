const shell = require("utils/shell");

/**
 * Shuts down the host machine via the DBus socket
 */
const poweroffHost = async () => {
  await shell(
    `dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 "org.freedesktop.login1.Manager.PowerOff" boolean:true`
  );
  return {
    message: `Halted machine.`,
    logMessage: true,
    userAction: true
  };
};

module.exports = poweroffHost;
