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
    link: "https://giveth.io/project/dappnode"
  },
  {
    logo: EcfLogo,
    text: "Ethereum Community Fund",
    link: "https://ecf.network/"
  }
];

export const advancedItems: {
  name: string;
  href: string;
  icon: (props: any) => JSX.Element;
}[] = [
  {
    name: "Community",
    href: communityRelativePath,
    icon: MdPeople
  },
  {
    name: "Sdk",
    href: sdkRelativePath,
    icon: MdBuild
  },
  {
    name: "Support",
    href: supportRelativePath,
    icon: MdHelp
  }
];

export const basicItems: {
  name: string;
  href: string;
  icon: (props: any) => JSX.Element;
}[] = [
  {
    name: "Dashboard",
    href: dashboardRelativePath,
    icon: MdDashboard
  },
  {
    name: "Wi-Fi",
    href: wifiRelativePath,
    icon: MdWifi
  },
  {
    name: "VPN",
    href: devicesRelativePath,
    icon: MdDevices
  },
  {
    name: "DAppStore",
    href: installerRelativePath,
    icon: MdCreateNewFolder
  },
  {
    name: "Packages",
    href: packagesRelativePath,
    icon: MdFolder
  },
  {
    name: "Stakers",
    href: stakersRelativePath,
    icon: SiEthereum
  },
  {
    name: "Rollups",
    href: rollupsRelativePath,
    icon: GiRolledCloth
  },
  {
    name: "Repository",
    href: repositoryRelativePath,
    icon: BiGitRepoForked
  },
  {
    name: "System",
    href: systemRelativePath,
    icon: MdSettings
  }
];
