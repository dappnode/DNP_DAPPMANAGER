import { PortProtocol } from "@dappnode/common";

export interface UpnpPortMapping {
  protocol: PortProtocol;
  exPort: string;
  inPort: string;
  ip: string;
}
