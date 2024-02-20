import * as dashboard from "./dashboard";
import * as VPN from "./vpn";
import * as installer from "./installer";
import * as packages from "./packages";
import * as sdk from "./sdk";
import * as support from "./support";
import * as system from "./system";
import * as wifi from "./wifi";
import * as community from "./community";
import * as stakers from "./stakers";
import * as rollups from "./rollups";
import * as repository from "./repository";

export const pages = {
  dashboard,
  wifi,
  VPN,
  installer,
  packages,
  stakers,
  rollups,
  sdk,
  support,
  community,
  system,
  repository
};

export const defaultPage = dashboard;
