import { PackageContainer } from "@dappnode/common";
import * as db from "../../db/index.js";
import { listContainers } from "../../modules/docker/list/index.js";
import {
  signDataFromPackage,
  getAddressFromPrivateKey
} from "../../utils/sign.js";
import { HttpError, wrapHandler } from "../utils.js";

type Params = Record<string, unknown>;

/**
 * Sign arbitrary requests by packages
 */
export const sign = wrapHandler<Params>(async (req, res) => {
  const data = req.body as string | undefined;

  try {
    if (typeof data === undefined) throw Error("missing");
    if (typeof data !== "string") throw Error("must be a string");
    if (!data) throw Error("must not be empty");
  } catch (e) {
    throw new HttpError({ statusCode: 400, name: `Arg data ${e.message}` });
  }

  const dnp = await getDnpFromIp(req.ip);

  const privateKey = db.dyndnsIdentity.get()?.privateKey;
  if (!privateKey) throw Error("Private key not initialized");

  const address = getAddressFromPrivateKey(privateKey);
  const signature = signDataFromPackage({
    privateKey,
    packageEnsName: dnp.dnpName,
    data
  });

  return res.status(200).send({
    signature,
    address
  });
});

/**
 * Find IPv4 adresses only, this is a IPv6 to IPv4 prefix
 */
export async function getDnpFromIp(ip: string): Promise<PackageContainer> {
  const ipv4 = ip.replace("::ffff:", "");
  const dnps = await listContainers();
  const dnp = dnps.find(_dnp => _dnp.ip === ipv4);
  if (!dnp)
    throw new HttpError({ statusCode: 405, name: `No DNP with ip ${ipv4}` });

  return dnp;
}
