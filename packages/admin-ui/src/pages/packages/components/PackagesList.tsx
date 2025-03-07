import React from "react";
import { NavLink } from "react-router-dom";
import { useApi } from "api";
import { packageRestart } from "../actions";
// Components
import { NoPackagesYet } from "./NoPackagesYet";
import { StateBadgeDnp, StateBadgeLegend } from "./StateBadge";
import Card from "components/Card";
// Icons
import { MdRefresh, MdOpenInNew } from "react-icons/md";
// Utils
import { prettyDnpName } from "utils/format";
import { sortBy } from "lodash-es";
// Images
import defaultAvatar from "img/defaultAvatar.png";
import dappnodeIcon from "img/dappnode-logo-only.png";
import { renderResponse } from "components/SwrRender";
import { coreDnpName } from "params";
import "./packages.scss";

export const PackagesList = ({ coreDnps }: { coreDnps: boolean }) => {
  const dnpsRequest = useApi.packagesGet();

  return renderResponse(dnpsRequest, ["Loading installed DAppNode Packages"], (dnps) => {
    const filteredDnps = dnps.filter((dnp) => Boolean(coreDnps) === Boolean(dnp.isCore) && dnp.dnpName !== coreDnpName);
    if (!filteredDnps.length) return <NoPackagesYet />;

    return (
      <Card>
        <StateBadgeLegend dnps={filteredDnps}></StateBadgeLegend>

        <div className="list-grid dnps no-a-style">
          <header>Status</header>
          <header> </header>
          <header>Name</header>
          <header>Open</header>
          <header>Restart</header>
          {sortBy(filteredDnps, (dnp) => dnp.dnpName).map((dnp) => (
            <React.Fragment key={dnp.dnpName}>
              {/* <StateBadge state={getWorstState(dnp)} /> */}
              <StateBadgeDnp dnp={dnp} />
              <img
                className="avatar"
                src={dnp.avatarUrl || (coreDnps ? dappnodeIcon : defaultAvatar)}
                // Display the broken image logo with no text
                alt=" "
              />
              <NavLink className="name" to={`${dnp.dnpName}/info`}>
                {prettyDnpName(dnp.dnpName)}
              </NavLink>
              <NavLink className="open" to={`${dnp.dnpName}/info`}>
                <MdOpenInNew />
              </NavLink>
              <MdRefresh
                className="hide-on-small"
                style={{ fontSize: "1.05rem" }}
                onClick={() => packageRestart(dnp).catch(console.error)}
              />
              <hr />
            </React.Fragment>
          ))}
        </div>
      </Card>
    );
  });
};
