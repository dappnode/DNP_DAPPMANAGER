import React from "react";
import { useApi } from "api";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { title } from "../data";
// This module
import InstallDnpView from "./InstallDnpView";
// Utils
import { prettyDnpName } from "utils/format";
import Title from "components/Title";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";

const InstallDnpContainer: React.FC = () => {
  const { id, version } = useParams<{ id: string, version: string }>();
  const progressLogsByDnp = useSelector(getProgressLogsByDnp);

  // TODO: return a beautiful error page
  if (!id) return <div>No ID provided in route parameters.</div>;

  const { data: dnp, error, isValidating } = useApi.fetchDnpRequest({ id, version });

  // Get progressLogs
  const dnpName = dnp?.dnpName;
  const progressLogs = dnpName ? progressLogsByDnp[dnpName] : undefined;

  return (
    <>
      <Title title={title} subtitle={dnpName ? prettyDnpName(dnpName) : id} />

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
