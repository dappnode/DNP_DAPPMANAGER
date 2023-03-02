import { Eth2ClientTarget } from "@dappnode/common";
import { EthClientStatusToSet } from "../types";
import React from "react";
import Button from "components/Button";
import { changeEthClientTarget } from "pages/system/actions";
import { Alert, ButtonGroup, Modal } from "react-bootstrap";
import { prettyDnpName } from "utils/format";

export default function RemoveClientsDialog({
  nextTarget,
  useCheckpointSync,
  prevExecClientStatus,
  prevConsClientStatus,
  prevTarget,
  removeClientsDialogShown,
  setRemoveClientsDialogShown,
  setPrevExecClientStatus,
  setPrevConsClientStatus
}: {
  nextTarget: Eth2ClientTarget;
  useCheckpointSync?: boolean;
  prevExecClientStatus: EthClientStatusToSet;
  prevConsClientStatus: EthClientStatusToSet;
  prevTarget: Exclude<Eth2ClientTarget, "remote">;
  removeClientsDialogShown: boolean;
  setRemoveClientsDialogShown: (removeClientsDialog: boolean) => void;
  setPrevExecClientStatus: (clientStatus: EthClientStatusToSet) => void;
  setPrevConsClientStatus: (clientStatus: EthClientStatusToSet) => void;
}) {
  return (
    <Modal
      show={removeClientsDialogShown}
      onHide={() => setRemoveClientsDialogShown(false)}
      //backdropClassName="modal-backdrop-dark"
    >
      <Modal.Header>
        <Modal.Title>Remove previous client(s)?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="description">
          Do you want to remove the previous client(s)? If you want to switch
          back to the previous client(s) in the future, you could select{" "}
          <b>Stop</b> instead to reduce sync time, but you won't save any disk
          space.
          {nextTarget === "remote" && (
            <>
              <br />
              <br />
              <Alert variant="warning">
                If you are validating or if you want to keep your full node
                active, you should select <b>Keep running</b>.
              </Alert>
            </>
          )}
        </div>

        <div className="content">
          {(nextTarget === "remote" ||
            prevTarget?.execClient !== nextTarget.execClient) && (
            <div className="client">
              <div
                className="client-name"
                style={{ fontWeight: "bold", fontSize: "large" }}
              >
                {prettyDnpName(prevTarget?.execClient)}
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Toggle
                  clientStatus={prevExecClientStatus}
                  setClientStatus={setPrevExecClientStatus}
                  canKeepRunning={nextTarget === "remote"}
                />
              </div>
            </div>
          )}

          {(nextTarget === "remote" ||
            prevTarget?.consClient !== nextTarget.consClient) && (
            <>
              <br />
              <div className="client">
                <div
                  className="client-name"
                  style={{ fontWeight: "bold", fontSize: "large" }}
                >
                  {prettyDnpName(prevTarget?.consClient)}
                </div>
                <Toggle
                  clientStatus={prevConsClientStatus}
                  setClientStatus={setPrevConsClientStatus}
                  canKeepRunning={nextTarget === "remote"}
                />
              </div>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={() => setRemoveClientsDialogShown(false)}
        >
          Cancel
        </Button>
        <Button
          variant="dappnode"
          onClick={() => changeEthClientTarget(nextTarget, useCheckpointSync)}
        >
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function Toggle({
  clientStatus,
  setClientStatus,
  canKeepRunning
}: {
  clientStatus: EthClientStatusToSet;
  setClientStatus: (clientStatus: EthClientStatusToSet) => void;
  canKeepRunning: boolean;
}) {
  const handleOptionClick = (option: EthClientStatusToSet) => {
    setClientStatus(option);
  };

  return (
    <ButtonGroup className="toggle">
      <Button
        variant={clientStatus === "removed" ? "secondary" : "outline-secondary"}
        onClick={() => handleOptionClick("removed")}
        className="toggle-btn"
      >
        Remove
      </Button>
      <Button
        variant={clientStatus === "stopped" ? "secondary" : "outline-secondary"}
        onClick={() => handleOptionClick("stopped")}
        className="toggle-btn"
      >
        Stop
      </Button>
      {canKeepRunning && (
        <Button
          variant={
            clientStatus === "running" ? "secondary" : "outline-secondary"
          }
          onClick={() => handleOptionClick("running")}
          className="toggle-btn"
        >
          Keep running
        </Button>
      )}
    </ButtonGroup>
  );
}
