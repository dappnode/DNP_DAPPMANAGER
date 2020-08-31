import React from "react";
import { useApi } from "api";
import { useSelector } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { title } from "../data";
// This module
import InstallDnpView from "./InstallDnpView";
// Utils
import { shortNameCapitalized } from "utils/format";
import Title from "components/Title";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";

const InstallDnpContainer: React.FC<RouteComponentProps<{ id: string }>> = ({
  match
}) => {
  const id = decodeURIComponent(match.params.id);

  const { data: dnp, error, isValidating } = useApi.fetchDnpRequest({ id });
  const progressLogsByDnp = useSelector(getProgressLogsByDnp);

  // Get progressLogs
  const dnpName = dnp?.dnpName;
  const progressLogs = dnpName ? progressLogsByDnp[dnpName] : undefined;

  return (
    <>
      <Title
        title={title}
        subtitle={dnpName ? shortNameCapitalized(dnpName) : id}
      />

      {dnp ? (
        <InstallDnpView dnp={dnp} progressLogs={progressLogs} />
      ) : error ? (
        <ErrorView error={error} />
      ) : isValidating ? (
        <Loading steps={["Loading DAppNode Package data"]} />
      ) : null}
    </>
  );
};

export default InstallDnpContainer;
