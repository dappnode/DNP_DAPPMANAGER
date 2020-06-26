import React from "react";
import { useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import { useApi } from "api";
import { packageRestart } from "../actions";
// Components
import NoPackagesYet from "./NoPackagesYet";
import StateBadge from "./StateBadge";
import Card from "components/Card";
// Icons
import { MdRefresh, MdOpenInNew } from "react-icons/md";
// Utils
import { shortNameCapitalized } from "utils/format";
import { sortBy } from "lodash";
import { rootPath as packagesRootPath } from "pages/packages";
// Images
import defaultAvatar from "img/defaultAvatar.png";
import dappnodeIcon from "img/dappnode-logo-only.png";
import "./packages.scss";
import { renderResponse } from "components/SwrRender";
import { coreName } from "params";

export const PackagesList = ({ coreDnps }: { coreDnps: boolean }) => {
  const dnpsRequest = useApi.packagesGet();
  const dispatch = useDispatch();

  return renderResponse(
    dnpsRequest,
    ["Loading installed DAppNode Packages"],
    dnps => {
      const filteredDnps = dnps.filter(
        dnp =>
          Boolean(coreDnps) === Boolean(dnp.isCore) && dnp.name !== coreName
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
    }
  );
};
