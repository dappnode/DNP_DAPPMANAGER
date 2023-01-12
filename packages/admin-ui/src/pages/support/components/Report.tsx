import React from "react";
import { useApi } from "api";
// Components
import Card from "components/Card";
// Styles
import RenderMarkdown from "components/RenderMarkdown";
import { formatTopicBody, formatTopicUrl } from "../formaters/discourseTopic";
import { topicBaseUrl, dappnodeForumUrl } from "params";
import { PackageVersionData, HostDiagnoseItem } from "@dappnode/common";
import Ok from "components/Ok";
import { FaDiscourse } from "react-icons/fa";
import { MdChevronRight } from "react-icons/md";

export default function Report() {
  const dnpsReq = useApi.packagesGet();
  const systemInfoReq = useApi.systemInfoGet();
  const diagnoseReq = useApi.diagnose();
  const hostStatsReq = useApi.statsDiskGet();
  const { versionData, versionDataVpn } = systemInfoReq.data || {};
  const diskUsedPercentage =
    hostStatsReq.data?.usedPercentage != null
      ? `${hostStatsReq.data?.usedPercentage}%`
      : "...";

  const versionDatas: { [name: string]: PackageVersionData | undefined } = {
    "dappmanager.dnp.dappnode.eth": versionData,
    "vpn.dnp.dappnode.eth": versionDataVpn,
    "admin.dnp.dappnode.eth": window.versionData
  };

  const coreDnpVersions = (dnpsReq.data || [])
    .filter(dnp => dnp.isCore)
    .map(dnp => ({
      name: dnp.dnpName,
      version: versionDatas[dnp.dnpName] || dnp.version
    }));

  const systemData: HostDiagnoseItem[] = [
    ...(diagnoseReq.data || []),
    { name: "Disk usage", data: diskUsedPercentage }
  ];

  const topicBody = formatTopicBody(coreDnpVersions, systemData);
  const topicUrlWithData = formatTopicUrl(topicBody);
  const topicUrlNoData = topicBaseUrl;
  const reqs = [dnpsReq, systemInfoReq, diagnoseReq, hostStatsReq];
  const isLoading = reqs.some(req => req.isValidating);
  const isLoaded = reqs.every(req => req.data);

  return (
    <Card>
      <p>
        To help the support team, the <strong>Report</strong> button will
        prefill a new forum topic with the information shown below. If you don't
        want to share any information, use the{" "}
        <strong>Report without providing information</strong> button.
      </p>

      <p>
        Before report, please, make sure that the topic does not already exits
        in our <a href={dappnodeForumUrl}>forum</a>
      </p>

      <div className="discourse-topic-header">
        <span className="location">
          <span className="logo">
            <FaDiscourse />
          </span>
          <MdChevronRight className="arrow" />
          <span>New topic</span>
          <MdChevronRight className="arrow" />
          <span>Body</span>
        </span>

        <span className="loader">
          <Ok msg="" loading={isLoading} ok={isLoaded} />
        </span>
      </div>
      <div className="discourse-topic-body">
        <RenderMarkdown source={topicBody} />
      </div>
      <a className="btn btn-dappnode mt-3 mr-3" href={topicUrlWithData}>
        Report
      </a>
      <a className="btn btn-outline-dappnode mt-3" href={topicUrlNoData}>
        Report without providing information
      </a>
    </Card>
  );
}
