import { Eth2ClientTarget, EthClientStatusToSet } from "@dappnode/common";
import React from "react";
import Button from "components/Button";
import { changeEthClientTarget } from "pages/system/actions";
import { Alert, Dropdown, DropdownButton, Modal } from "react-bootstrap";
import { prettyDnpName } from "utils/format";
import { useDispatch } from "react-redux";

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
  const dispatch = useDispatch();

  return (
    <Modal
      show={removeClientsDialogShown}
      onHide={() => setRemoveClientsDialogShown(false)}
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
              <div className="dropdown-container">
                <ClientStatusDropdown
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
                <div className="dropdown-container">
                  <ClientStatusDropdown
                    clientStatus={prevConsClientStatus}
                    setClientStatus={setPrevConsClientStatus}
                    canKeepRunning={nextTarget === "remote"}
                  />
                </div>
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
          onClick={() =>
            dispatch(
              changeEthClientTarget(
                nextTarget,
                prevExecClientStatus,
                prevConsClientStatus,
                useCheckpointSync
              )
            )
          }
        >
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function ClientStatusDropdown({
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

  const dropdownTitle = (
    <>
      {clientStatus === "removed" && "Remove"}
      {clientStatus === "stopped" && "Stop"}
      {clientStatus === "running" && "Keep running"}
    </>
  );

  return (
    <DropdownButton
      title={dropdownTitle}
      variant="outline-secondary"
      className="toggle"
    >
      <Dropdown.Item
        active={clientStatus === "removed"}
        onClick={() => handleOptionClick("removed")}
      >
        Remove
      </Dropdown.Item>
      <Dropdown.Item
        active={clientStatus === "stopped"}
        onClick={() => handleOptionClick("stopped")}
      >
        Stop
      </Dropdown.Item>
      {canKeepRunning && (
        <Dropdown.Item
          active={clientStatus === "running"}
          onClick={() => handleOptionClick("running")}
        >
          Keep running
        </Dropdown.Item>
      )}
    </DropdownButton>
  );
}
