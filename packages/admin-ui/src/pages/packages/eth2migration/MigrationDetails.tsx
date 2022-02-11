import React from "react";
import { Modal } from "react-bootstrap";
import "./migrationDetails.scss";
import Button from "components/Button";

import { BsListCheck } from "react-icons/bs";
import { BiExport } from "react-icons/bi";
import { BiImport } from "react-icons/bi";
import { RiInstallLine } from "react-icons/ri";
import { RiUninstallLine } from "react-icons/ri";
import { VscError } from "react-icons/vsc";

const migrationDetailsSteps = [
  {
    icon: BsListCheck,
    title: "Ensure migration requirements"
  },
  {
    icon: RiInstallLine,
    title: "Install web3signer and Ethereum 2 client selected"
  },
  {
    icon: BiExport,
    title:
      "Export validator keystores and slashing protection history to a safe location"
  },
  {
    icon: BiImport,
    title:
      "Import validator keystores and slashing protection history to the web3signer"
  },
  {
    icon: RiUninstallLine,
    title: "Remove the old client Prysm non web3signer"
  },
  {
    icon: VscError,
    title: "Rollback to previous version if something goes wrong"
  }
];

function MigrationDetails({
  migrationDetails,
  setMigrationDetails
}: {
  migrationDetails: {
    status: boolean;
    client: string;
    network: string;
  };

  setMigrationDetails: React.Dispatch<
    React.SetStateAction<{
      status: boolean;
      client: string;
      network: string;
    }>
  >;
}) {
  return (
    <Modal
      show={migrationDetails.status}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <Modal.Title id="contained-modal-title-vcenter">
          Migration from Prysm-{migrationDetails.network} to{" "}
          {migrationDetails.client}-{migrationDetails.network}-web3signer
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="migration-details-steps">
          {migrationDetailsSteps.map((step, index) => (
            <div className="migration-details-step" key={index}>
              <step.icon className="migration-details-step-icon" /> {step.title}
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() =>
            setMigrationDetails({ status: false, client: "", network: "" })
          }
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default MigrationDetails;
