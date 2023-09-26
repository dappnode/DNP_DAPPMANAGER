import { listContainers } from "../modules/docker/api/index.js";
import { params } from "@dappnode/params";
import memoize from "memoizee";

const dmName = params.dappmanagerDnpName;

const getDappmanagerImageMemoized = memoize(
  async (): Promise<string> => {
    const containers = await listContainers({ filters: { name: [dmName] } });
    const dappmanager = containers[0];

    if (!dappmanager) throw Error(`No image found for ${dmName}`);
    else return dappmanager.Image;
  },
  { promise: true }
);

/**
 * Returns the image of the current dappmanager instance running
 * It's memoized since the image will not change until this app is reseted
 */
export default async function getDappmanagerImage(): Promise<string> {
  return getDappmanagerImageMemoized();
}
