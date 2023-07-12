import {
  GlobalEnvs,
  computeGlobalEnvsFromDb
} from "../../modules/globalEnvs.js";
import { wrapHandler } from "../utils.js";

interface Params {
  name: string;
}

/**
 * Query publicly available global envs
 */
export const globalEnvs = wrapHandler<Params>(async (req, res) => {
  const name = req.params.name as keyof GlobalEnvs | undefined;
  const globalEnvs = computeGlobalEnvsFromDb(false);

  if (name) {
    // Accept both "INTERNAL_IP" and "internal_ip"
    const nameCaps = name.toUpperCase() as keyof GlobalEnvs;
    if (name in globalEnvs || nameCaps in globalEnvs) {
      res.status(200).send(globalEnvs[name] || globalEnvs[nameCaps] || "");
    } else {
      res.status(404).send();
    }
  } else {
    res.status(200).send(globalEnvs);
  }
});
