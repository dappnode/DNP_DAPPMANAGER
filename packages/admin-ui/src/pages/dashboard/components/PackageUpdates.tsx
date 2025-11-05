import React, { useState } from "react";
import { useApi } from "api";
import { getInstallerPath } from "pages/installer";
import { UpdateAvailable } from "@dappnode/types";
import { useNavigate } from "react-router-dom";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import CardList from "components/CardList";
import { prettyDnpName } from "utils/format";
import { Accordion, useAccordionButton } from "react-bootstrap";
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
          <div className="card card-body">All packages are up to date</div>
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

  const toggle = useAccordionButton("0", () => setIsOpen((v) => !v));

  return (
    <div className="package-update-item">
      <Accordion activeKey={isOpen ? "0" : undefined} className="package-update-accordion">
        <Accordion.Item eventKey="0">
          {/* Clickable header (replaces Accordion.Toggle) */}
          <div
            role="button"
            tabIndex={0}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(e);
              }
            }}
          >
            <div>
              <span className="dnp-name">{prettyDnpName(update.dnpName)}</span> v{update.newVersion}{" "}
              {isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </div>
          </div>

          {/* Collapsible content (replaces Accordion.Collapse) */}
          <Accordion.Body>
            <div>
              {Array.isArray(update.upstreamVersion) && update.upstreamVersion.length > 0 && (
                <ul className="package-update-details">
                  {update.upstreamVersion.map((upstreamVersion, i) => (
                    <li key={`${upstreamVersion}-${i}`}>{upstreamVersion}</li>
                  ))}
                </ul>
              )}
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <div className="package-update-actions">
        <Button onClick={() => navigate(`${getInstallerPath(update.dnpName)}/${update.dnpName}`)} variant="dappnode">
          Update
        </Button>
      </div>
    </div>
  );
}
