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
import { GiRolledCloth } from "react-icons/gi";
// URLs
import { relativePath as dashboardRelativePath } from "pages/dashboard";
import { relativePath as devicesRelativePath } from "pages/vpn";
import { relativePath as installerRelativePath } from "pages/installer";
import { relativePath as packagesRelativePath } from "pages/packages";
import { relativePath as systemRelativePath } from "pages/system";
import { relativePath as sdkRelativePath } from "pages/sdk";
import { relativePath as supportRelativePath } from "pages/support";
import { relativePath as wifiRelativePath } from "pages/wifi";
import { relativePath as communityRelativePath } from "pages/community";
import { relativePath as stakersRelativePath } from "pages/stakers";
import { relativePath as rollupsRelativePath } from "pages/rollups";
import { relativePath as repositoryRelativePath } from "pages/repository";

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

export const sidenavItems: {
  name: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: (props: any) => JSX.Element;
  show: boolean;
}[] = [
  {
    name: "Dashboard",
    href: dashboardRelativePath,
    icon: MdDashboard,
    show: true
  },
  {
    name: "Wi-Fi",
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
    name: "DAppStore",
    href: installerRelativePath,
    icon: MdCreateNewFolder,
    show: true
  },
  {
    name: "Packages",
    href: packagesRelativePath,
    icon: MdFolder,
    show: true
  },
  {
    name: "Stakers",
    href: stakersRelativePath,
    icon: SiEthereum,
    show: true
  },
  {
    name: "Rollups",
    href: rollupsRelativePath,
    icon: GiRolledCloth,
    show: true
  },
  {
    name: "Repository",
    href: repositoryRelativePath,
    icon: BiGitRepoForked,
    show: true
  },
  {
    name: "System",
    href: systemRelativePath,
    icon: MdSettings,
    show: true
  },
  {
    name: "Community",
    href: communityRelativePath,
    icon: MdPeople,
    show: true
  },
  {
    name: "Sdk",
    href: sdkRelativePath,
    icon: MdBuild,
    show: true
  },
  {
    name: "Support",
    href: supportRelativePath,
    icon: MdHelp,
    show: true
  }
];
