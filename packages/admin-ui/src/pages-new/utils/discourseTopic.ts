import { PackageVersionData, HostDiagnoseItem } from "@dappnode/types";
import { topicBaseUrl } from "params";

interface TopicBodySection {
  title: string;
  items: { name: string; data: string }[];
}

export function formatTopicBody(
  coreDnpVersions: { name: string; version: string | PackageVersionData }[],
  hostDiagnoseItems: HostDiagnoseItem[]
): string {
  const sections: TopicBodySection[] = [
    {
      title: "Core DAppNode Packages versions",
      items: coreDnpVersions
        .map(({ name, version }) => ({
          name,
          data: typeof version === "object" ? printVersionData(version) : version
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    {
      title: "System info",
      items: hostDiagnoseItems
    }
  ];

  return [
    "*Before filing a new topic, please **provide the following information**.*",
    ...sections
      .filter(({ items }) => items.length)
      .map(({ title, items }) => `## ${title}\n` + items.map(({ name, data }) => `- **${name}**: ${data}`).join("\n"))
  ].join("\n\n");
}

export function formatTopicUrl(body: string) {
  const topicCategory = "5";
  const title = "";
  const params = [
    "title=" + encodeURIComponent(title),
    "body=" + encodeURIComponent(body),
    "category_id=" + encodeURIComponent(topicCategory)
  ];
  return topicBaseUrl + "?" + params.join("&");
}

function printVersionData(versionData: PackageVersionData): string {
  const { branch, commit, version } = versionData || {};
  return [version, branch && branch !== "master" && `branch: ${branch}`, commit && `commit: ${commit.slice(0, 8)}`]
    .filter((data) => data)
    .join(", ");
}
