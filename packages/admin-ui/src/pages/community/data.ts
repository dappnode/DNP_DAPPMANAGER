import { FaCommentsDollar, FaDiscord, FaDiscourse, FaGithub } from "react-icons/fa";
import { IconType } from "react-icons/lib";
import DiscordActions from "./components/DiscordActions";
import DiscourseActions from "./components/DiscourseActions";
import GithubActions from "./components/GithubActions";
import GitcoinActions from "./components/GitcoinActions";

export const relativePath = "community";
export const rootPath = "community";
export const title = "Community";

export const communityTypes: CommunityItem[] = [
  {
    subPath: "discord",
    title: "Discord",
    icon: FaDiscord,
    actions: [DiscordActions],
    text: "DAppNode has a vibrant community. You can get support, share your experience, and just hang out with other Node Runners in our Discord Server"
  },
  {
    subPath: "gitcoin",
    title: "Gitcoin Grant",
    icon: FaCommentsDollar,
    actions: [GitcoinActions],
    text: "Vote with your money! A small donation can be greatly matched to support Dappnode's Open Source efforts."
  },
  {
    subPath: "discourse",
    title: "Discourse",
    icon: FaDiscourse,
    actions: [DiscourseActions],
    text: "How-tos, Deep Dives, support questions… our Forum is the place where information that shouldn’t be lost in a chat should go!"
  },
  {
    subPath: "github",
    title: "Github",
    icon: FaGithub,
    actions: [GithubActions],
    text: "DAppNode is Free Open Source Software. You can review and contribute to its codebase on GitHub!"
  }
];

export interface CommunityItem {
  subPath: string;
  title: string;
  actions: (() => JSX.Element)[];
  icon: IconType;
  text: string;
}
