import * as dashboard from "./dashboard";
import * as dashboardv2 from "./dashboard_v2"; // Temporary alias while we transition to the new dashboard
import * as VPN from "./vpn";
import * as installer from "./installer";
import * as packages from "./packages";
import * as sdk from "./sdk";
import * as support from "./support";
import * as system from "./system";
import * as wifi from "./wifi";
import * as community from "./community";
import * as stakers from "./stakers";
import * as notifications from "./notifications";
import * as premium from "./premium";

export const pages = {
  dashboard,
  dashboardv2, // Temporary alias while we transition to the new dashboard
  wifi,
  VPN,
  installer,
  packages,
  stakers,
  sdk,
  support,
  community,
  system,
  notifications,
  premium
};

export const defaultPage = dashboard;
