import * as dashboard from "./dashboard";
import * as VPN from "./devices";
import * as installer from "./installer";
import * as packages from "./packages";
import * as sdk from "./sdk";
import * as support from "./support";
import * as system from "./system";

export default {
  dashboard,
  VPN,
  installer,
  packages,
  sdk,
  support,
  system
};

export const defaultPage = dashboard;
