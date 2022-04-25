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
  MdPeople
} from "react-icons/md";
import { SiEthereum } from "react-icons/si";
import { BiGitRepoForked } from "react-icons/bi";
// URLs
import { rootPath as dashboardRootPath } from "pages/dashboard";
import { rootPath as devicesRootPath } from "pages/vpn";
import { rootPath as installerRootPath } from "pages/installer";
import { rootPath as packagesRootPath } from "pages/packages";
import { rootPath as systemRootPath } from "pages/system";
import { rootPath as sdkRootPath } from "pages/sdk";
import { rootPath as supportRootPath } from "pages/support";
import { rootPath as wifiRootPath } from "pages/wifi";
import { rootPath as communityRootPath } from "pages/community";
import { rootPath as stakersRootPath } from "pages/stakers";
import { rootPath as repositoryRootPath } from "pages/repository";

export const fundedBy: { logo: string; text: string; link: string }[] = [
  {
    logo: EfgLogo,
    text: "Ethereum Foundation",
    link:
      "https://blog.ethereum.org/2018/08/17/ethereum-foundation-grants-update-wave-3/"
  },
  {
    logo: AragonLogo,
    text: "Aragon Nest",
    link: "https://blog.aragon.org/aragon-nest-second-round-of-grants/#dappnode"
  },
  {
    logo: GivethLogo,
    text: "Giveth",
    link: "https://beta.giveth.io/campaigns/5b44b198647f33526e67c262"
  },
  {
    logo: EcfLogo,
    text: "Ethereum Community Fund",
    link: "https://ecf.network/"
  }
];

export const sidenavItems: {
  name: string;
  href: string;
  icon: (props: any) => JSX.Element;
}[] = [
  {
    name: "Dashboard",
    href: dashboardRootPath,
    icon: MdDashboard
  },
  {
    name: "Wi-Fi",
    href: wifiRootPath,
    icon: MdWifi
  },
  {
    name: "VPN",
    href: devicesRootPath,
    icon: MdDevices
  },
  {
    name: "DAppStore",
    href: installerRootPath,
    icon: MdCreateNewFolder
  },
  {
    name: "Packages",
    href: packagesRootPath,
    icon: MdFolder
  },
  {
    name: "Stakers",
    href: stakersRootPath,
    icon: SiEthereum
  },
  {
    name: "Repository",
    href: repositoryRootPath,
    icon: BiGitRepoForked
  },
  {
    name: "System",
    href: systemRootPath,
    icon: MdSettings
  },
  {
    name: "Community",
    href: communityRootPath,
    icon: MdPeople
  },
  {
    name: "Sdk",
    href: sdkRootPath,
    icon: MdBuild
  },
  {
    name: "Support",
    href: supportRootPath,
    icon: MdHelp
  }
];
