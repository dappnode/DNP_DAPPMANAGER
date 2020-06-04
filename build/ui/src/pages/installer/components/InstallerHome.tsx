import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RouteComponentProps, NavLink } from "react-router-dom";
import { throttle, isEmpty } from "lodash";
import { SelectedCategories } from "../types";
import { title } from "../data";
// This page
import isIpfsHash from "utils/isIpfsHash";
import isDnpDomain from "utils/isDnpDomain";
import { correctPackageName } from "../utils";
import filterDirectory from "../helpers/filterDirectory";
import { rootPath } from "../data";
import NoPackageFound from "./NoPackageFound";
import CategoryFilter from "./CategoryFilter";
import DnpStore from "./DnpStore";
// Components
import Title from "components/Title";
import Input from "components/Input";
import Button, { ButtonLight } from "components/Button";
import Loading from "components/Loading";
import Error from "components/Error";
import Alert from "react-bootstrap/Alert";
// Selectors
import {
  getDnpDirectory,
  getDirectoryRequestStatus
} from "services/dnpDirectory/selectors";
import { fetchDnpDirectory } from "services/dnpDirectory/actions";
import { rootPath as packagesRootPath } from "pages/packages/data";
import { activateFallbackPath } from "pages/system/data";
import { getEthClientWarning } from "services/dappnodeStatus/selectors";
// Styles
import "./installer.scss";

export const InstallerHome: React.FC<RouteComponentProps> = ({
  // React Routes
  history
}) => {
  const directory = useSelector(getDnpDirectory);
  const requestStatus = useSelector(getDirectoryRequestStatus);
  const ethClientWarning = useSelector(getEthClientWarning);
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(
    {} as SelectedCategories
  );
  const [showErrorDnps, setShowErrorDnps] = useState(false);

  useEffect(() => {
    dispatch(fetchDnpDirectory());
  }, [dispatch]);

  // Limit the number of requests [TESTED]
  const fetchQueryThrottled = useMemo(
    () =>
      throttle((query: string) => {
        // #### TODO: provide feedback to the user if the query is found
      }, 500),
    []
  );

  useEffect(() => {
    fetchQueryThrottled(query);
    // If the packageLink is a valid IPFS hash preload it's info
    if (isIpfsHash(query) || isDnpDomain(query)) fetchQueryThrottled(query);
  }, [query, fetchQueryThrottled]);

  function openDnp(id: string) {
    const dnp = directory.find(({ name }) => name === id);
    if (dnp && dnp.status === "ok" && dnp.isUpdated)
      history.push(packagesRootPath + "/" + dnp.name);
    else history.push(rootPath + "/" + encodeURIComponent(id));
  }

  function onCategoryChange(category: string) {
    setSelectedCategories(x => ({ ...x, [category]: !x[category] }));
  }

  const directoryFiltered = filterDirectory({
    directory,
    query,
    selectedCategories
  });

  /**
   * 1. If the query is a valid IPFS hash, open it
   * 2. If the query matches exactly one DNP, open it
   * 0. Else open the query
   */
  function runQuery() {
    if (isIpfsHash(query)) return openDnp(query);
    if (directoryFiltered.length === 1)
      return openDnp(directoryFiltered[0].name);
    else openDnp(query);
  }

  const categories = {
    ...directory.reduce((obj: SelectedCategories, dnp) => {
      if (dnp.status === "ok")
        for (const category of dnp.categories) obj[category] = false;
      return obj;
    }, {}),
    ...selectedCategories
  };

  const dnpsNoError = directoryFiltered.filter(dnp => dnp.status !== "error");
  const dnpsFeatured = dnpsNoError.filter(dnp => dnp.isFeatured);
  const dnpsNormal = dnpsNoError.filter(dnp => !dnp.isFeatured);
  const dnpsError = directoryFiltered.filter(dnp => dnp.status === "error");

  return (
    <>
      <Title title={title} />

      <Input
        placeholder="DAppNode Package's name or IPFS hash"
        value={query}
        onValueChange={(value: string) => setQuery(correctPackageName(value))}
        onEnterPress={runQuery}
        append={<ButtonLight onClick={runQuery}>Search</ButtonLight>}
      />

      {isEmpty(categories) && directory.length ? (
        <div className="type-filter placeholder" />
      ) : (
        <CategoryFilter
          categories={categories}
          onCategoryChange={onCategoryChange}
        />
      )}

      {ethClientWarning && (
        <Alert variant="warning">
          The DAppStore will not work temporarily. Eth client not available:{" "}
          {ethClientWarning}
          <br />
          Enable the{" "}
          <NavLink to={activateFallbackPath}>
            repository source fallback
          </NavLink>{" "}
          to use the DAppStore meanwhile
        </Alert>
      )}

      {directory.length ? (
        !directoryFiltered.length ? (
          <NoPackageFound query={query} />
        ) : (
          <div className="dnps-container">
            <DnpStore directory={dnpsFeatured} openDnp={openDnp} featured />
            <DnpStore directory={dnpsNormal} openDnp={openDnp} />
            {dnpsError.length ? (
              showErrorDnps ? (
                <DnpStore directory={dnpsError} openDnp={openDnp} />
              ) : (
                <Button onClick={() => setShowErrorDnps(true)}>
                  Show packages still propagating
                </Button>
              )
            ) : null}
          </div>
        )
      ) : requestStatus.error ? (
        <Error
          msg={`Error loading DAppNode Packages: ${requestStatus.error}`}
        />
      ) : requestStatus.loading ? (
        <Loading msg="Loading DAppNode Packages..." />
      ) : requestStatus.success ? (
        <Error msg={"Directory loaded but found no packages"} />
      ) : null}
    </>
  );
};
