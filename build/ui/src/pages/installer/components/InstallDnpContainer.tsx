import React from "react";
import useSWR from "swr";
import { api } from "api";
import { useSelector } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { title } from "../data";
// This module
import InstallDnpView from "./InstallDnpView";
// Utils
import { shortNameCapitalized } from "utils/format";
import Title from "components/Title";
import Loading from "components/Loading";
import Error from "components/Error";
import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";

const InstallDnpContainer: React.FC<RouteComponentProps<{ id: string }>> = ({
  match
}) => {
  const id = decodeURIComponent(match.params.id);

  const { data: dnp, error, isValidating } = useSWR(
    [id, "fetchDnpRequest"],
    id => api.fetchDnpRequest({ id })
  );
  const progressLogsByDnp = useSelector(getProgressLogsByDnp);

  // Get progressLogs
  const progressLogs =
    dnp && dnp.name ? progressLogsByDnp[dnp.name] : undefined;

  return (
    <>
      <Title
        title={title}
        subtitle={dnp && dnp.name ? shortNameCapitalized(dnp.name) : id}
      />

      {dnp ? (
        <InstallDnpView dnp={dnp} progressLogs={progressLogs} />
      ) : isValidating ? (
        <Loading msg={"Loading DAppNode Package data..."} />
      ) : error ? (
        <Error msg={error} />
      ) : null}
    </>
  );
};

export default InstallDnpContainer;
