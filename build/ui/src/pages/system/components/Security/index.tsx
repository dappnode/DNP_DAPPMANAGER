import React from "react";
import { useSelector } from "react-redux";
// Components
import SubTitle from "components/SubTitle";
import Card from "components/Card";
import StatusIcon from "components/StatusIcon";
import SeverityBadge, { SeverityLevel } from "./SeverityBadge";
import ChangeHostUserPassword from "./ChangeHostUserPassword";
import ChangeWifiPassword from "./ChangeWifiPassword";
// External
import {
  getPasswordIsInsecure,
  getIsWifiRunning
} from "services/dappnodeStatus/selectors";
// Style
import "./security.scss";
import { getAreWifiCredentialsDefault } from "services/dnpInstalled/selectors";
import Ok from "components/Ok";

interface SecurityIssue {
  name: string;
  severity: SeverityLevel;
  component: React.FC;
  isActive: boolean;
  okMessage: string;
}

export default function SystemSecurity() {
  const passwordIsInsecure = useSelector(getPasswordIsInsecure);
  const areWifiCredentialsDefault = useSelector(getAreWifiCredentialsDefault);
  const isWifiRunning = useSelector(getIsWifiRunning);

  const securityIssues: SecurityIssue[] = [
    {
      name: "Change host user password",
      severity: "critical",
      component: ChangeHostUserPassword,
      isActive: passwordIsInsecure,
      okMessage: "Host user password changed"
    },
    {
      name: "Change WIFI default password",
      severity: "critical",
      component: ChangeWifiPassword,
      isActive: areWifiCredentialsDefault && Boolean(isWifiRunning),
      okMessage: isWifiRunning
        ? "WIFI credentials changed"
        : "WIFI is not required"
    }
  ];

  const issuesToShow = securityIssues.filter(issue => issue.isActive);
  const areActiveIssues = issuesToShow.length > 0;

  return (
    <>
      <Card spacing>
        <StatusIcon
          success={!areActiveIssues}
          message={
            areActiveIssues
              ? "Some issues require your attention"
              : "Issues addressed"
          }
        />
        <hr />
        <div>
          {securityIssues.map(issue => (
            <Ok
              key={issue.name}
              msg={issue.isActive ? issue.name : issue.okMessage}
              ok={!issue.isActive}
            />
          ))}
        </div>
      </Card>

      {issuesToShow.map(issue => (
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
