import React from "react";
import { useSelector } from "react-redux";
import { coreDnpName } from "params";
// Selectors
import { RootState } from "rootReducer";
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
import ErrorView from "components/ErrorView";
import { ProgressLogsView } from "pages/installer/components/InstallCardComponents/ProgressLogsView";

export default function SystemUpdate() {
  const coreProgressLogs = useSelector(state =>
    getProgressLogsOfDnp(state as RootState, coreDnpName)
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
        <Loading steps={["Checking core version", "Loading version details"]} />
      ) : error ? (
        <ErrorView error={`Error checking core version: ${error}`}></ErrorView>
      ) : success ? (
        <Card spacing>
          <StatusIcon success message="System up to date" />
        </Card>
      ) : null}
    </>
  );
}
