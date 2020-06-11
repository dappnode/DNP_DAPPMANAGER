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
  MdDashboard
} from "react-icons/md";

export const fundedBy: { logo: string; text: string; link?: string }[] = [
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
    text: "Ethereum Community Fund"
  }
];

export const sidenavItems: {
  name: string;
  href: string;
  icon: (props: any) => JSX.Element;
}[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: MdDashboard
  },
  {
    name: "Devices",
    href: "/devices",
    icon: MdDevices
  },
  {
    name: "DAppStore",
    href: "/installer",
    icon: MdCreateNewFolder
  },
  {
    name: "Packages",
    href: "/packages",
    icon: MdFolder
  },
  {
    name: "System",
    href: "/system",
    icon: MdSettings
  },
  {
    name: "Sdk",
    href: "/sdk",
    icon: MdBuild
  },
  {
    name: "Support",
    href: "/support",
    icon: MdHelp
  }
];
