import shell from "../utils/shell";
import getDappmanagerImage from "../utils/getDappmanagerImage";

const baseCommand = `docker run --rm -v /run/dbus/system_bus_socket:/run/dbus/system_bus_socket --privileged --entrypoint=""`;

/**
 * Reboots the host machine via the DBus socket
 */
export default async function rebootHost(): Promise<void> {
  const image = await getDappmanagerImage();
  await shell(
    `${baseCommand} ${image} sh -c "dbus-send --system --print-reply \
    --dest=org.freedesktop.login1 /org/freedesktop/login1 \
    org.freedesktop.login1.Manager.Reboot boolean:true"`
  );
}
