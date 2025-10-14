// FundedBy icons
import EfgLogo from "img/logos/efg-logo-only-min.png";
import AragonLogo from "img/logos/aragon-min.png";
import GivethLogo from "img/logos/giveth-min.png";
import EcfLogo from "img/logos/ecf-min.png";
// Icons
import {
  MdSettings,
  MdBuild,
  MdCreateNewFolder,
  MdFolder,
  MdHelp,
  MdDevices,
  MdDashboard,
  MdWifi,
  MdPeople,
  MdStar
} from "react-icons/md";
import { FaRegBell } from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
// URLs
import { relativePath as dashboardRelativePath } from "pages/dashboard";
import { relativePath as dashboardv2RelativePath } from "pages/dashboard_v2";
import { relativePath as devicesRelativePath } from "pages/vpn";
import { relativePath as installerRelativePath } from "pages/installer";
import { relativePath as packagesRelativePath } from "pages/packages";
import { relativePath as systemRelativePath } from "pages/system";
import { relativePath as sdkRelativePath } from "pages/sdk";
import { relativePath as supportRelativePath } from "pages/support";
import { relativePath as wifiRelativePath } from "pages/wifi";
import { relativePath as communityRelativePath } from "pages/community";
import { relativePath as stakersRelativePath } from "pages/stakers";
import { relativePath as notificationsRelativePath } from "pages/notifications";
import { relativePath as premiumRelativePath } from "pages/premium";

export const fundedBy: { logo: string; text: string; link: string }[] = [
  {
    logo: EfgLogo,
    text: "Ethereum Foundation",
    link: "https://blog.ethereum.org/2018/08/17/ethereum-foundation-grants-update-wave-3/"
  },
  {
    logo: AragonLogo,
    text: "Aragon Nest",
    link: "https://blog.aragon.org/aragon-nest-second-round-of-grants/#dappnode"
  },
  {
    logo: GivethLogo,
    text: "Giveth",
    link: "https://giveth.io/project/dappnode"
  },
  {
    logo: EcfLogo,
    text: "Ethereum Community Fund",
    link: "https://ecf.network/"
  }
];

export const premiumLabel = "PREMIUM";

export const sidenavItems: {
  name: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: (props: any) => JSX.Element;
  show: boolean;
}[] = [
  {
    name: "DASHBOARD",
    href: dashboardRelativePath,
    icon: MdDashboard,
    show: true
  },
  {
    name: "DASHBOARD v2",
    href: dashboardv2RelativePath,
    icon: MdDashboard,
    show: true
  },
  {
    name: "WI-FI",
    href: wifiRelativePath,
    icon: MdWifi,
    show: true
  },
  {
    name: "VPN",
    href: devicesRelativePath,
    icon: MdDevices,
    show: true
  },
  {
    name: "DAPPSTORE",
    href: installerRelativePath,
    icon: MdCreateNewFolder,
    show: true
  },
  {
    name: "PACKAGES",
    href: packagesRelativePath,
    icon: MdFolder,
    show: true
  },
  {
    name: "STAKERS",
    href: stakersRelativePath,
    icon: SiEthereum,
    show: true
  },
  {
    name: "SYSTEM",
    href: systemRelativePath,
    icon: MdSettings,
    show: true
  },
  {
    name: "NOTIFICATIONS",
    href: notificationsRelativePath,
    icon: FaRegBell,
    show: true
  },
  {
    name: "COMMUNITY",
    href: communityRelativePath,
    icon: MdPeople,
    show: true
  },
  {
    name: "SDK",
    href: sdkRelativePath,
    icon: MdBuild,
    show: true
  },
  {
    name: "SUPPORT",
    href: supportRelativePath,
    icon: MdHelp,
    show: true
  },
  {
    name: premiumLabel,
    href: premiumRelativePath,
    icon: MdStar,
    show: true
  }
];
