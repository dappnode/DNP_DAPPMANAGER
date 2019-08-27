import shell from "../utils/shell";

/**
 * Shuts down the host machine via the DBus socket
 */
export default async function poweroffHost() {
  await shell(
    `dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 "org.freedesktop.login1.Manager.PowerOff" boolean:true`
  );
  return {
    message: `Halted machine.`,
    logMessage: true,
    userAction: true
  };
}
