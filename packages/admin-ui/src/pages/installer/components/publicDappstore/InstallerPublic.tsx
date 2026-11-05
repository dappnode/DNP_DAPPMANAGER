import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { throttle, isEmpty } from "lodash-es";
import { SelectedCategories } from "../../types";
// This page
import isIpfsHash from "utils/isIpfsHash";
import isDnpDomain from "utils/isDnpDomain";
import { correctPackageName } from "../../utils";
import filterDirectory from "../../helpers/filterDirectory";
import CategoryFilter from "../CategoryFilter";
import NoPackageFound from "../NoPackageFound";
import DnpStore from "../DnpStore";
// Components
import { AlertDismissible } from "components/AlertDismissible";
import Input from "components/Input";
import Button from "components/Button";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
// Selectors
import { getDnpRegistry, getRegistryRequestStatus } from "services/dnpRegistry/selectors";
import { fetchDnpRegistry } from "services/dnpRegistry/actions";

export const InstallerPublic: React.FC = () => {
  const navigate = useNavigate();

  const registry = useSelector(getDnpRegistry);
  const requestStatus = useSelector(getRegistryRequestStatus);
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState({} as SelectedCategories);
  const [showErrorDnps, setShowErrorDnps] = useState(false);

  useEffect(() => {
    dispatch(fetchDnpRegistry());
  }, [dispatch]);

  // Limit the number of requests [TESTED]
  const fetchQueryThrottled = useMemo(
    () =>
      throttle((_query: string) => {
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
    navigate(encodeURIComponent(id));
  }

  function onCategoryChange(category: string) {
    setSelectedCategories((x) => ({ ...x, [category]: !x[category] }));
  }

  const directoryFiltered = filterDirectory({
    directory: registry,
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
    if (directoryFiltered.length === 1) return openDnp(directoryFiltered[0].name);
    else openDnp(query);
  }

  const categories = {
    ...registry.reduce((obj: SelectedCategories, dnp) => {
      if (dnp.status === "ok") for (const category of dnp.categories) obj[category] = false;
      return obj;
    }, {}),
    ...selectedCategories
  };

  const dnpsNoError = directoryFiltered.filter((dnp) => dnp.status !== "error");
  const dnpsFeatured = dnpsNoError.filter((dnp) => dnp.isFeatured);
  const dnpsNormal = dnpsNoError.filter((dnp) => !dnp.isFeatured);
  const dnpsError = directoryFiltered.filter((dnp) => dnp.status === "error");

  return (
    <>
      <AlertDismissible variant="warning">
        The public repository is open and permissionless and can contain malicious packages that can compromise the
        security of your DAppNode. ONLY use the public repo if you know what you are doing and ONLY install packages
        whose developer you trust.
      </AlertDismissible>
      <Input
        placeholder="DAppNode Package's name or IPFS hash"
        value={query}
        onValueChange={(value: string) => setQuery(correctPackageName(value))}
        onEnterPress={runQuery}
        append={<Button onClick={runQuery}>Search</Button>}
      />

      {isEmpty(categories) && registry.length ? (
        <div className="type-filter placeholder" />
      ) : (
        <CategoryFilter categories={categories} onCategoryChange={onCategoryChange} />
      )}

      {registry.length ? (
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
                <Button onClick={() => setShowErrorDnps(true)}>Show packages still propagating</Button>
              )
            ) : null}
          </div>
        )
      ) : requestStatus.error ? (
        <ErrorView error={requestStatus.error} />
      ) : requestStatus.loading ? (
        <Loading steps={["Loading DAppNode Packages"]} />
      ) : requestStatus.success ? (
        <ErrorView error={"Directory loaded but found no packages"} />
      ) : null}
    </>
  );
};
