import React from "react";
import Alert from "react-bootstrap/esm/Alert";
import { useApi } from "api";
import { rootPath as installerRootPath } from "pages/installer";
import { UpdateAvailable } from "types";
import { NavLink } from "react-router-dom";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import CardList from "components/CardList";
import { prettyDnpName } from "utils/format";
import { urlJoin } from "utils/url";
import { legacyClientPackages } from "params";
import { confirm } from "components/ConfirmDialog";
import semver from "semver";

export function PackageUpdates() {
  const dnps = useApi.packagesGet();

  if (dnps.error) return <ErrorView error={dnps.error} hideIcon red />;
  if (dnps.isValidating) return <Ok loading msg="Loading packages" />;
  if (!dnps.data) return <ErrorView error={"No data"} hideIcon red />;

  const updatesAvailable: {
    dnpName: string;
    dnpVersion: string;
    updateAvailable: UpdateAvailable;
  }[] = [];
  for (const dnp of dnps.data) {
    if (dnp.updateAvailable) {
      updatesAvailable.push({
        dnpName: dnp.dnpName,
        dnpVersion: dnp.version,
        updateAvailable: dnp.updateAvailable
      });
    }
  }

  async function clientLegacyUpdateWarning(dnpName: string) {
    await new Promise<void>(resolve =>
      confirm({
        title: `Update ${prettyDnpName(dnpName)}`,
        text: `This is a major update with breaking changes with no rollback available. Please, stay until the update is done`,
        label: "Continue",
        onClick: resolve
      })
    );
  }

  return (
    <div className="dashboard-cards">
      <div className="package-updates">
        {updatesAvailable.length === 0 ? (
          <Alert className="package-updates-card" variant="success">
            All packages are up to date
          </Alert>
        ) : (
          <CardList className="package-updates">
            {updatesAvailable.map(
              ({ dnpName, dnpVersion, updateAvailable }) => (
                <div className="package-update-item">
                  <span>
                    <strong>{prettyDnpName(dnpName)}</strong> to version{" "}
                    {updateAvailable.newVersion}{" "}
                    {updateAvailable.upstreamVersion &&
                      `(${updateAvailable.upstreamVersion} upstream)`}
                  </span>
                  {legacyClientPackages.some(
                    clientPkg =>
                      clientPkg.dnpName === dnpName &&
                      semver.lt(dnpVersion, clientPkg.version)
                  ) ? (
                    <NavLink to={urlJoin(installerRootPath, dnpName)}>
                      <Button
                        onClick={() => clientLegacyUpdateWarning(dnpName)}
                        variant="dappnode"
                      >
                        Update
                      </Button>
                    </NavLink>
                  ) : (
                    <NavLink to={urlJoin(installerRootPath, dnpName)}>
                      <Button variant="dappnode">Update</Button>
                    </NavLink>
                  )}
                </div>
              )
            )}
          </CardList>
        )}
      </div>
    </div>
  );
}
