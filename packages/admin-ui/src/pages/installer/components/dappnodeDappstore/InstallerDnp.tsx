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
import NoPackageFound from "../NoPackageFound";
import CategoryFilter from "../CategoryFilter";
import DnpStore from "../DnpStore";
// Components
import Input from "components/Input";
import Button from "components/Button";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
// Selectors
import { getDnpDirectory, getDirectoryRequestStatus } from "services/dnpDirectory/selectors";
import { fetchDnpDirectory } from "services/dnpDirectory/actions";
import { confirmPromise } from "components/ConfirmDialog";
import { stakehouseLsdUrl } from "params";
import { InstallerAIBanner } from "../aiDappstore/InstallerAiBanner";

export const InstallerDnp: React.FC = () => {
  const navigate = useNavigate();

  const directory = useSelector(getDnpDirectory);
  const requestStatus = useSelector(getDirectoryRequestStatus);
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState({} as SelectedCategories);
  const [showErrorDnps, setShowErrorDnps] = useState(false);

  useEffect(() => {
    dispatch(fetchDnpDirectory());
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
    // Middleware for Ethereum, Gnosis and Stakehouse fake cards to redirect to stakers UI:
    // - Mainnet: http://my.dappnode/stakers/mainnet
    // - Gnosis: http://my.dappnode/stakers/gnosis
    // - Stakehouse: http://my.dappnode/stakers/stakehouse
    if (id === "ethereum.dnp.dappnode.eth") navigate("/stakers/ethereum");
    else if (id === "gnosis.dnp.dappnode.eth") navigate("/stakers/gnosis");
    else if (id === "stakehouse.dnp.dappnode.eth") {
      // open a dialog that says it will open an external link, are you sure?
      confirmPromise({
        title: "Ready to Explore Stakehouse?",
        text:
          "Clicking 'Open' will direct you to external Stakehouse App in a new tab. It's not part of Dappnode, but it's a trusted platform. Happy journey!",
        buttons: [
          {
            label: "Cancel",
            onClick: () => null
          },
          {
            label: "Open",
            variant: "dappnode",
            onClick: () => {
              window.open(stakehouseLsdUrl, "_blank");
            }
          }
        ]
      });
    } else {
      // Check if version has been defined like dnpName:version
      const [dnpName, version] = id.split(":");

      const encodedDnpName = encodeURIComponent(dnpName);
      const encodedVersion = version ? encodeURIComponent(version) : null;

      const pkgPath = encodedVersion ? `${encodedDnpName}?version=${encodedVersion}` : encodedDnpName;

      navigate(pkgPath);
    }
  }

  // Toggle category: sets only one category to true at a time
  function onCategoryChange(category: string) {
    setSelectedCategories((x) => {
      const newCategories = { ...x, [category]: !x[category] };

      // If the category has been set to true, set all others to false
      if (newCategories[category]) {
        Object.keys(newCategories).forEach((key) => {
          if (key !== category) newCategories[key] = false;
        });
      }
      return newCategories;
    });
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
    if (directoryFiltered.length === 1) return openDnp(directoryFiltered[0].name);
    else openDnp(query);
  }

  const categories = {
    ...directory.reduce((obj: SelectedCategories, dnp) => {
      if (dnp.status === "ok") for (const category of dnp.categories) obj[category] = false;
      return obj;
    }, {}),
    ...selectedCategories
  };

  const dnpsNoError = directoryFiltered.filter((dnp) => dnp.status !== "error");
  // const dnpsFeatured = dnpsNoError.filter((dnp) => dnp.isFeatured);
  const dnpsNormal = dnpsNoError.filter((dnp) => !dnp.isFeatured);
  const dnpsError = directoryFiltered.filter((dnp) => dnp.status === "error");

  return (
    <>
      <Input
        placeholder="Dappnode Package's name or IPFS hash"
        value={query}
        onValueChange={(value: string) => setQuery(correctPackageName(value))}
        onEnterPress={runQuery}
        append={<Button onClick={runQuery}>Search</Button>}
      />

      {isEmpty(categories) && directory.length ? (
        <div className="type-filter placeholder" />
      ) : (
        <CategoryFilter categories={categories} onCategoryChange={onCategoryChange} />
      )}

      {directory.length ? (
        !directoryFiltered.length ? (
          <NoPackageFound query={query} />
        ) : (
          <>
            {!selectedCategories.AI && <InstallerAIBanner onCategoryChange={onCategoryChange} />}
            <div className="dnps-container">
              {/* <DnpStore directory={dnpsFeatured} openDnp={openDnp} featured /> */}
              <DnpStore directory={dnpsNormal} openDnp={openDnp} />
              {dnpsError.length ? (
                showErrorDnps ? (
                  <DnpStore directory={dnpsError} openDnp={openDnp} />
                ) : (
                  <Button onClick={() => setShowErrorDnps(true)}>Show packages still propagating</Button>
                )
              ) : null}
            </div>
          </>
        )
      ) : requestStatus.error ? (
        <ErrorView error={requestStatus.error} />
      ) : requestStatus.loading ? (
        <Loading steps={["Loading Dappnode Packages"]} />
      ) : requestStatus.success ? (
        <ErrorView error={"Directory loaded but found no packages"} />
      ) : null}
    </>
  );
};
