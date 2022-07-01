import { MockDnp } from "./types";

const dnpName = "yuki.dnp.dappnode.eth";
const serviceName = dnpName;

export const yuki: MockDnp = {
  metadata: {
    name: dnpName,
    version: "0.1.0",
    description: "DAppNode yuki rebranding",
    type: "dncore"
  },

  installedData: {
    version: "0.1.0"
  },
  installedContainers: {
    [serviceName]: {
      state: "running"
    }
  }
};
