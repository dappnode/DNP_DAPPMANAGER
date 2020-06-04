import React from "react";
import { useApi } from "api";
// Components
import Card from "components/Card";
// Styles
import RenderMarkdown from "components/RenderMarkdown";
import { formatIssueBody, formatIssueUrl } from "../formaters/githubIssue";
import { issueBaseUrl } from "params";
import { PackageVersionData } from "common/types";
import Ok from "components/Ok";
import { FaGithub } from "react-icons/fa";

export default function Report() {
  const dnpsReq = useApi.listPackages();
  const systemInfoReq = useApi.systemInfoGet();
  const diagnoseReq = useApi.diagnose();
  const hostStatsReq = useApi.getStats();
  const dnps = dnpsReq.data || [];
  const { versionData, versionDataVpn } = systemInfoReq.data || {};
  const diagnose = diagnoseReq.data || [];
  const hostStats = hostStatsReq.data || {};

  const versionDatas: { [name: string]: PackageVersionData | undefined } = {
    "dappmanager.dnp.dappnode.eth": versionData,
    "vpn.dnp.dappnode.eth": versionDataVpn,
    "admin.dnp.dappnode.eth": window.versionData
  };

  const coreDnpVersions = dnps
    .filter(dnp => dnp.isCore)
    .map(dnp => ({
      name: dnp.name,
      version: versionDatas[dnp.name] || dnp.version
    }));

  const systemData = [
    ...diagnose,
    { name: "Disk usage", result: hostStats.disk }
  ];

  const issueBody = formatIssueBody(coreDnpVersions, systemData);
  const issueUrlWithData = formatIssueUrl(issueBody);
  const issueUrlNoData = issueBaseUrl;
  const reqs = [dnpsReq, systemInfoReq, diagnoseReq, hostStatsReq];
  const isLoading = reqs.some(req => req.isValidating);
  const isLoaded = reqs.every(req => req.data);

  return (
    <Card>
      <p>
        To help the support team, the <strong>Report issue</strong> button will
        prefill the Github issue with the information shown below. If you don't
        want to share any information, use the{" "}
        <strong>Report issue without providing information</strong> button.
      </p>

      <div className="github-issue-header">
        <span className="location">
          <span className="logo">
            <FaGithub />
          </span>
          <span className="arrow">></span>
          <span>New issue</span>
          <span className="arrow">></span>
          <span>Body</span>
        </span>

        <span className="loader">
          <Ok msg="" loading={isLoading} ok={isLoaded} />
        </span>
      </div>
      <div className="github-issue-body">
        <RenderMarkdown source={issueBody} />
      </div>
      <a className="btn btn-dappnode mt-3 mr-3" href={issueUrlWithData}>
        Report issue
      </a>
      <a className="btn btn-outline-dappnode mt-3" href={issueUrlNoData}>
        Report issue without providing information
      </a>
    </Card>
  );
}
