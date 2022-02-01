import { MockDnp } from "./types";
import { badSignature } from "./badSignature";
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
import { wireguard } from "./wireguard";
import { prysmPraterLegacy } from "./prysmPraterLegacy";
import { prysmPraterStableLegacy } from "./prysmStableLegacy";

export const mockDnps: MockDnp[] = [
  bitcoin,
  httpsPortal,
  isInstalling,
  badSignature,
  lightningNetwork,
  multiService,
  openEthereum,
  raiden,
  raidenTestnet,
  trustlines,
  wifi,
  wireguard,
  prysmPraterLegacy,
  prysmPraterStableLegacy
];
