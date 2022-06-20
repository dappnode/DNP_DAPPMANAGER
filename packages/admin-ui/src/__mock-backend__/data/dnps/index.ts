import { MockDnp } from "./types";
import { badSignature } from "./badSignature";
import { bitcoin } from "./bitcoin";
import { httpsPortal } from "./https-portal";
import { isInstalling } from "./isInstalling";
import { lightningNetwork } from "./lightningNetwork";
import { multiService } from "./multiService";
import { raiden } from "./raiden";
import { raidenTestnet } from "./raidenTestnet";
import { trustlines } from "./trustlines";
import { wifi } from "./wifi";
import { wireguard } from "./wireguard";

export const mockDnps: MockDnp[] = [
  bitcoin,
  httpsPortal,
  isInstalling,
  badSignature,
  lightningNetwork,
  multiService,
  raiden,
  raidenTestnet,
  trustlines,
  wifi,
  wireguard
];
