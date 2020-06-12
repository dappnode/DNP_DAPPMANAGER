import { PortProtocol } from "../../types";

export interface UpnpPortMapping {
  protocol: PortProtocol;
  exPort: string;
  inPort: string;
  ip: string;
}
