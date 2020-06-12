import { PackageVersionData } from "types";
import { issueBaseUrl } from "params";

/**
 * Info selectors
 * ==============
 *
 * Must return an object as:
 *
 * {
 *   name: {string},
 *   result: {string}, (or)
 *   error: {string}
 * }
 */
interface IssueDataItem {
  name: string;
  result?: string;
  error?: string;
}

/**
 * Construct github issue
 * ======================
 *
 * Before filing a new issue...
 *
 * Core DNPs versions
 * - admin.dnp.dappnode.eth: 0.1.18
 * ...
 *
 * System info
 * - docker version:
 * ...
 */

interface IssueBodySection {
  title: string;
  items: { name: string; data: string }[];
}

export function formatIssueBody(
  coreDnpVersions: { name: string; version: string | PackageVersionData }[],
  systemData: IssueDataItem[]
): string {
  const sections: IssueBodySection[] = [
    {
      title: "Core DAppNode Packages versions",
      items: coreDnpVersions.map(({ name, version }) => ({
        name,
        data: typeof version === "object" ? printVersionData(version) : version
      }))
    },
    {
      title: "System info",
      items: Object.values(systemData)
        .filter(Boolean)
        .map(({ name, result, error }) => ({
          name,
          data: (result || error || "").trim()
        }))
    }
  ];

  return [
    "*Before filing a new issue, please **provide the following information**.*",
    ...sections
      .filter(({ items }) => items.length)
      .map(
        ({ title, items }) =>
          `## ${title}\n` +
          items.map(({ name, data }) => `- **${name}**: ${data}`).join("\n")
      )
  ].join("\n\n");
}

export function formatIssueUrl(body: string) {
  // Construct issueUrl from the available info
  const title = "";
  const params = [
    "title=" + encodeURIComponent(title),
    "body=" + encodeURIComponent(body)
  ];
  return issueBaseUrl + "?" + params.join("&");
}

/**
 * Utilities
 * =========
 */

/**
 * Print git version data
 * @param version "0.2.0"
 * @param versionData { version: "0.2.1", branch: "next" }
 * @returns "0.2.0, branch: next"
 */
function printVersionData(versionData: PackageVersionData): string {
  const { branch, commit, version } = versionData || {};
  return [
    version,
    branch && branch !== "master" && `branch: ${branch}`,
    commit && `commit: ${commit.slice(0, 8)}`
  ]
    .filter(data => data)
    .join(", ");
}
