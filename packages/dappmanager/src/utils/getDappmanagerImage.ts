import { dockerList } from "../modules/docker/dockerApi";
import params from "../params";
import memoize from "memoizee";

const dmName = params.dappmanagerDnpName;

const getDappmanagerImageMemoized = memoize(
  async (): Promise<string> => {
    const containers = await dockerList({ filters: { name: [dmName] } });
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
export default async function getDappmanagerImage() {
  return getDappmanagerImageMemoized();
}
