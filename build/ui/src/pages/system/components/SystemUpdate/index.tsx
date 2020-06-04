import React from "react";
import { useSelector } from "react-redux";
import { coreName } from "params";
// Selectors
import { getProgressLogsOfDnp } from "services/isInstallingLogs/selectors";
import {
  getCoreUpdateAvailable,
  getCoreRequestStatus
} from "services/coreUpdate/selectors";
// Components
import Card from "components/Card";
import StatusIcon from "components/StatusIcon";
import SystemUpdateDetails from "./SystemUpdateDetails";
import Loading from "components/Loading";
import SubTitle from "components/SubTitle";
import ErrorView from "components/Error";
import { ProgressLogsView } from "pages/installer/components/InstallCardComponents/ProgressLogsView";

export default function SystemUpdate() {
  const coreProgressLogs = useSelector((state: any) =>
    getProgressLogsOfDnp(state, coreName)
  );
  const { loading, success, error } = useSelector(getCoreRequestStatus);
  const coreUpdateAvailable = useSelector(getCoreUpdateAvailable);

  return (
    <>
      <SubTitle>Update</SubTitle>
      {/* This component will automatically hide if logs are empty */}
      <ProgressLogsView progressLogs={coreProgressLogs} />

      {coreUpdateAvailable ? (
        <SystemUpdateDetails />
      ) : loading ? (
        <Loading msg="Checking core version..." />
      ) : error ? (
        <ErrorView msg={`Error checking core version: ${error}`}></ErrorView>
      ) : success ? (
        <Card spacing>
          <StatusIcon success message="System up to date" />
        </Card>
      ) : null}
    </>
  );
}
