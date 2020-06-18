import React, { useEffect } from "react";
import * as s from "../selectors";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import { packageRestart } from "../actions";
import { fetchDnpInstalled } from "services/dnpInstalled/actions";
// Components
import NoPackagesYet from "./NoPackagesYet";
import StateBadge from "./PackageViews/StateBadge";
import Card from "components/Card";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
// Selectors
import { getDnpInstalledStatus } from "services/dnpInstalled/selectors";
// Icons
import { MdRefresh, MdOpenInNew } from "react-icons/md";
// Utils
import { shortNameCapitalized } from "utils/format";
import { sortBy } from "lodash";
import { rootPath as packagesRootPath } from "pages/packages";
// Images
import defaultAvatar from "img/defaultAvatar.png";
import dappnodeIcon from "img/dappnode-logo-only.png";

export const PackagesList = ({ coreDnps }: { coreDnps: boolean }) => {
  const dispatch = useDispatch();
  const dnps = useSelector(s.getFilteredPackages);
  const { loading, error } = useSelector(getDnpInstalledStatus);

  useEffect(() => {
    dispatch(fetchDnpInstalled());
  }, [dispatch]);

  if (!dnps.length) {
    if (loading)
      return <Loading steps={["Loading installed DAppNode Packages"]} />;
    if (error)
      return (
        <ErrorView
          error={`Error loading installed DAppNode Packages: ${error}`}
        />
      );
  }

  const filteredDnps = dnps.filter(
    dnp => Boolean(coreDnps) === Boolean(dnp.isCore)
  );
  if (!filteredDnps.length) return <NoPackagesYet />;

  return (
    <Card className={`list-grid dnps no-a-style`}>
      <header className="center">Status</header>
      <header className="center"> </header>
      <header>Name</header>
      <header>Open</header>
      <header className="restart">Restart</header>
      {sortBy(filteredDnps, pkg => pkg.name).map(
        ({ name, state, avatarUrl }) => (
          <React.Fragment key={name}>
            <StateBadge state={state} />
            <img
              className="avatar"
              src={avatarUrl || (coreDnps ? dappnodeIcon : defaultAvatar)}
              alt="Avatar"
            />
            <NavLink className="name" to={`${packagesRootPath}/${name}`}>
              {shortNameCapitalized(name)}
            </NavLink>
            <NavLink className="open" to={`${packagesRootPath}/${name}`}>
              <MdOpenInNew />
            </NavLink>
            <MdRefresh
              className="restart"
              style={{ fontSize: "1.05rem" }}
              onClick={() => dispatch(packageRestart(name))}
            />
            <hr />
          </React.Fragment>
        )
      )}
    </Card>
  );
};
