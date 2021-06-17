import * as dashboard from "./dashboard";
import * as VPN from "./vpn";
import * as installer from "./installer";
import * as packages from "./packages";
import * as sdk from "./sdk";
import * as support from "./support";
import * as system from "./system";
import * as wifi from "./wifi";
import * as community from "./community";

export default {
  dashboard,
  wifi,
  VPN,
  installer,
  packages,
  sdk,
  support,
  community,
  system
};

export const defaultPage = dashboard;
