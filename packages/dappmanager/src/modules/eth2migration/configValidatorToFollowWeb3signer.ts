import { Eth2Client } from "./params";

export async function configValidatorToFollowWeb3signer(
  client: Eth2Client
): Promise<void> {
  switch (client) {
    case "lighthouse":
    // Lighthouse
    // - Write to the YAML file declare pubkeys with the web3signer URL

    case "teku":
    // Teku
    // - Write to the YAML file declare pubkeys with the web3signer URL
    // - Flag with web3signer URL + send SIGHUP to process to reload configuration
    //   After receiving the signal Teku will fetch pubkeys from the /list endpoint

    case "prysm":
    // Prysm
    // - ???
  }
}
