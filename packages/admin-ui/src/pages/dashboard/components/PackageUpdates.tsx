import React, { useState } from "react";
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
import { Accordion } from "react-bootstrap";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
interface UpdatesInterface extends UpdateAvailable {
  dnpName: string;
}

export function PackageUpdates() {
  const dnps = useApi.packagesGet();

  if (dnps.error) return <ErrorView error={dnps.error} hideIcon red />;
  if (dnps.isValidating) return <Ok loading msg="Loading packages" />;
  if (!dnps.data) return <ErrorView error={"No data"} hideIcon red />;

  const updatesAvailable: UpdatesInterface[] = [];
  for (const dnp of dnps.data) {
    if (dnp.updateAvailable) {
      const upstreamVersions = dnp.updateAvailable.upstreamVersion?.toString().split(",");
      updatesAvailable.push({
        dnpName: dnp.dnpName,
        newVersion: dnp.updateAvailable.newVersion,
        upstreamVersion: upstreamVersions
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
          <>
            {updatesAvailable.map((update) => (
              <>
                <CardList className="package-updates">
                  <UpdateCard key={update.dnpName} update={update} />
                </CardList>
              </>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function UpdateCard({ update }: { update: UpdatesInterface }) {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <div className="package-update-item">
      <Accordion defaultActiveKey={isOpen ? "0" : "1"} className="package-update-accordion">
        <Accordion.Toggle as={"div"} eventKey="0" onClick={() => setIsOpen(!isOpen)}>
          <div>
            <strong>{prettyDnpName(update.dnpName)}</strong> v{update.newVersion}
            {isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>
          <Accordion.Collapse eventKey="0">
            <div>
              {Array.isArray(update.upstreamVersion) && update.upstreamVersion.length > 0 && (
                <ul className="package-update-details">
                  {update.upstreamVersion.map((upstreamVersion) => (
                    <li>{upstreamVersion}</li>
                  ))}{" "}
                </ul>
              )}
            </div>
          </Accordion.Collapse>
        </Accordion.Toggle>{" "}
      </Accordion>
      <div className="package-update-actions">
        <Button onClick={() => navigate(`${getInstallerPath(update.dnpName)}/${update.dnpName}`)} variant="dappnode">
          Update
        </Button>
      </div>
    </div>
  );
}
