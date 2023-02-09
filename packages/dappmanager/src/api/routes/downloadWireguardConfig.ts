import * as calls from "../../calls/index.js";
import { wrapHandlerHtml } from "../utils.js";

interface Params {
  device: string;
}

/**
 * Endpoint to download wireguard remote/local config
 * - /device_admin/local
 * - /device_admin/
 */
export const downloadWireguardConfig = wrapHandlerHtml<Params>(
  async (req, res) => {
    const isLocal = req.query.local === "" || req.query.local;

    const device = req.params.device;
    if (!device) throw Error(`Must provide device`);

    const { configRemote, configLocal } = await calls.wireguardDeviceGet(
      device
    );

    const filename = `wireguard-${isLocal ? "local" : ""}config-${device}.txt`;
    const mimetype = "text/plain";
    res.setHeader("Content-disposition", "attachment; filename=" + filename);
    res.setHeader("Content-type", mimetype);

    res.status(200).send(isLocal ? configLocal : configRemote);
  }
);
