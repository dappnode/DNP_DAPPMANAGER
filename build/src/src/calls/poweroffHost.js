const shell = require("utils/shell");
const getDappmanagerImage = require("utils/getDappmanagerImage");

const baseCommand = `docker run --rm -v /run/dbus/system_bus_socket:/run/dbus/system_bus_socket --privileged --entrypoint=""`;

/**
 * Shuts down the host machine via the DBus socket
 */
const poweroffHost = async () => {
  const image = await getDappmanagerImage();
  await shell(
    `${baseCommand} ${image} sh -c "dbus-send --system --print-reply \
    --dest=org.freedesktop.login1 /org/freedesktop/login1 \
    org.freedesktop.login1.Manager.PowerOff boolean:true"`
  );
  return {
    message: `Halted machine.`,
    logMessage: true,
    userAction: true
  };
};

module.exports = poweroffHost;
