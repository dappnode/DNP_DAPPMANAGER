import { MockDnp } from "./types";
import { bitcoin } from "./bitcoin";
import { httpsPortal } from "./https-portal";
import { isInstalling } from "./isInstalling";
import { lightningNetwork } from "./lightningNetwork";
import { multiService } from "./multiService";
import { openEthereum } from "./openEthereum";
import { raiden } from "./raiden";
import { raidenTestnet } from "./raidenTestnet";
import { trustlines } from "./trustlines";
import { wifi } from "./wifi";

export const mockDnps: MockDnp[] = [
  bitcoin,
  httpsPortal,
  isInstalling,
  lightningNetwork,
  multiService,
  openEthereum,
  raiden,
  raidenTestnet,
  trustlines,
  wifi
];
