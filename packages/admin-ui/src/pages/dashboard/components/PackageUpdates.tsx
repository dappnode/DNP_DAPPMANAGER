import React from "react";
import Alert from "react-bootstrap/esm/Alert";
import { useApi } from "api";
import { getInstallerPath } from "pages/installer";
import { UpdateAvailable } from "@dappnode/types";
import { useNavigate } from "react-router-dom";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import CardList from "components/CardList";
import { prettyDnpName } from "utils/format";

export function PackageUpdates() {
  const dnps = useApi.packagesGet();
  const navigate = useNavigate();

  if (dnps.error) return <ErrorView error={dnps.error} hideIcon red />;
  if (dnps.isValidating) return <Ok loading msg="Loading packages" />;
  if (!dnps.data) return <ErrorView error={"No data"} hideIcon red />;

  const updatesAvailable: {
    dnpName: string;
    updateAvailable: UpdateAvailable;
  }[] = [];
  for (const dnp of dnps.data) {
    if (dnp.updateAvailable) {
      updatesAvailable.push({
        dnpName: dnp.dnpName,
        updateAvailable: dnp.updateAvailable
      });
    }
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
            {updatesAvailable.map(({ dnpName, updateAvailable }) => (
              <div className="package-update-item">
                <span>
                  <strong>{prettyDnpName(dnpName)}</strong> to version {updateAvailable.newVersion}{" "}
                  {updateAvailable.upstreamVersion && `(${updateAvailable.upstreamVersion} upstream)`}
                </span>

                <Button onClick={() => navigate(`${getInstallerPath(dnpName)}/${dnpName}`)} variant="dappnode">
                  Update
                </Button>
              </div>
            ))}
          </CardList>
        )}
      </div>
    </div>
  );
}
