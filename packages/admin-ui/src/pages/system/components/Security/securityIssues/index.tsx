import React from "react";
import { useSelector } from "react-redux";
// Components
import SubTitle from "components/SubTitle";
import Card from "components/Card";
import StatusIcon from "components/StatusIcon";
import SeverityBadge, { SeverityLevel } from "./SeverityBadge";
import ChangeHostUserPassword from "./ChangeHostUserPassword";
import ChangeWifiPassword from "./ChangeWifiPassword";
import Ok from "components/Ok";
// External
import { getPasswordIsSecure, getWifiStatus } from "services/dappnodeStatus/selectors";
// Style
import "./securityIssues.scss";

interface SecurityIssue {
  name: string;
  severity: SeverityLevel;
  component: React.FC;
  isActive: boolean;
  okMessage: string;
}

export default function SecurityIssues() {
  const passwordIsSecure = useSelector(getPasswordIsSecure);
  const wifiStatus = useSelector(getWifiStatus);

  const securityIssues: SecurityIssue[] = [
    {
      name: "Change host user password",
      severity: "critical",
      component: ChangeHostUserPassword,
      isActive: passwordIsSecure === false,
      okMessage: "Host user password changed"
    },
    {
      name: "Change WIFI default password",
      severity: "critical",
      component: ChangeWifiPassword,
      isActive: Boolean(wifiStatus?.isDefaultPassphrase && wifiStatus?.isRunning),
      okMessage: wifiStatus?.isRunning ? "WIFI credentials changed" : "WIFI is disabled"
    }
  ];

  const issuesToShow = securityIssues.filter((issue) => issue.isActive);
  const areActiveIssues = issuesToShow.length > 0;

  return (
    <>
      <Card spacing>
        <StatusIcon
          success={!areActiveIssues}
          message={areActiveIssues ? "Some issues require your attention" : "Issues addressed"}
        />
        <hr />
        <div>
          {securityIssues.map((issue) => (
            <Ok key={issue.name} msg={issue.isActive ? issue.name : issue.okMessage} ok={!issue.isActive} />
          ))}
        </div>
      </Card>

      {issuesToShow.map((issue) => (
        <React.Fragment key={issue.name}>
          <div className="security-issue-header">
            <SubTitle>{issue.name}</SubTitle>
            <SeverityBadge severity={issue.severity} />
          </div>
          <issue.component />
        </React.Fragment>
      ))}
    </>
  );
}
