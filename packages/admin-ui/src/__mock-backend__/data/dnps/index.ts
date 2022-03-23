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
import { prysmPrater } from "./prysmPrater";

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
  prysmPrater
];
