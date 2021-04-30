import {
  FaCoins,
  FaCommentsDollar,
  FaDiscord,
  FaDiscourse,
  FaGithub
} from "react-icons/fa";
import { IconType } from "react-icons/lib";
import DiscordActions from "./components/DiscordActions";
import DiscourseActions from "./components/DiscourseActions";
import GithubActions from "./components/GithubActions";
import GrantsActions from "./components/GrantsActions";
import TreasuryActions from "./components/TreasuryActions";

export const rootPath = "/community";
export const title = "Community";

export const communityTypes: CommunityItem[] = [
  {
    subPath: "discord",
    title: "Discord",
    icon: FaDiscord,
    actions: [DiscordActions],
    text:
      "DAppNode has a vibrant community. You can get support, share your experience, suggest improvements and just hang out with other Node Runners in our Discord Server"
  },
  {
    subPath: "github",
    title: "Github",
    icon: FaGithub,
    actions: [GithubActions],
    text:
      "DAppNode is Free Open Source Software. You can review and contribute to its codebase on GitHub!"
  },
  {
    subPath: "discourse",
    title: "Discourse",
    icon: FaDiscourse,
    actions: [DiscourseActions],
    text:
      "How-tos, Deep Dives, support questions… our Forum is the place where information that shouldn’t be lost in a chat should go!"
  },

  {
    subPath: "grants",
    title: "Grants",
    icon: FaCoins,
    actions: [GrantsActions],
    text:
      "If you are getting value out of DAppNode, consider donating to our Gitcoin Grant. And even better if it is during an active Matching Round!"
  },
  {
    subPath: "treasury",
    title: "Treasury",
    icon: FaCommentsDollar,
    actions: [TreasuryActions],
    text:
      "As an open source project, community contribution is our most added value. Contribute to DAppNode by asking questions, answering questions, developing DAppNode packages, reporting issues and anything you may think it is useful.You will be rewarded for contributing on any of the platforms"
  }
];

export interface CommunityItem {
  subPath: string;
  title: string;
  actions: (() => JSX.Element)[];
  icon: IconType;
  text: string;
}
