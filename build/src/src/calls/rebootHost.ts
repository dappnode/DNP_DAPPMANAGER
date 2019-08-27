import shell from "../utils/shell";

/**
 * Reboots the host machine via the DBus socket
 */
export default async function rebootHost() {
  await shell(
    `dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 "org.freedesktop.login1.Manager.Reboot" boolean:true`
  );
  return {
    message: `Rebooted machine.`,
    logMessage: true,
    userAction: true
  };
}
