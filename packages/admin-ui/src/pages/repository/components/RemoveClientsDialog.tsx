import { Eth2ClientTarget } from "@dappnode/common";
import { isEqual } from "lodash-es";
import { useSelector } from "react-redux";
import { getEthClientTarget } from "services/dappnodeStatus/selectors";
import { EthClientStatusToSet } from "../types";
import { useState } from "react";
import React from "react";
import Button from "components/Button";

export default function RemoveClientsDialog(
  nextTarget: Eth2ClientTarget,
  useCheckpointSync?: boolean
) {
  //TODO: Is "running" the best status to set as default?
  const [prevExecClientStatus, setPrevExecClientStatus] = useState<
    EthClientStatusToSet
  >("running");

  const [prevConsClientStatus, setPrevConsClientStatus] = useState<
    EthClientStatusToSet
  >("running");

  //Get prevTarget from redux (AppThunk async getState)
  const prevTarget = useSelector(getEthClientTarget);

  // Make sure the target has changed or the call will error
  if (isEqual(nextTarget, prevTarget)) return;

  if (prevTarget === "remote") return;

  return (
    <>
      <div className="remove-clients-dialog-container opacity-1">
        <div className="header">
          <div className="title">Remove previous client(s)?</div>
          <div className="description">
            Do you want to remove the previous client(s)? If you want to switch
            back to the previous client(s) in the future, you could select
            'Stop' instead to reduce sync time, but you won't save any disk
            space.
            {nextTarget === "remote" && (
              <>
                <br />
                If you are validating or if you want to keep your full node
                active, you should select 'Keep running'.
              </>
            )}
          </div>
        </div>

        <div className="content">
          {(nextTarget === "remote" ||
            prevTarget?.execClient !== nextTarget.execClient) && (
            <div className="client">
              <div className="client-name"></div>
              <Toggle
                clientStatus={prevExecClientStatus}
                setClientStatus={setPrevExecClientStatus}
                canKeepRunning={nextTarget === "remote"}
              />
            </div>
          )}

          {(nextTarget === "remote" ||
            prevTarget?.consClient !== nextTarget.consClient) && (
            <div className="client">
              <div className="client-name">Consensus client</div>
              <Toggle
                clientStatus={prevConsClientStatus}
                setClientStatus={setPrevConsClientStatus}
                canKeepRunning={nextTarget === "remote"}
              />
            </div>
          )}
        </div>

        <div className="bottom-buttons">
          <Button
            onClick={() => console.log("TODO")} // TODO: Perform actions depending on the selected options
            variant="dappnode"
          >
            Apply
          </Button>
        </div>
      </div>
    </>
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
    <div>
      <label
        style={{
          backgroundColor: clientStatus === "stopped" ? "green" : "white"
        }}
        onClick={() => handleOptionClick("stopped")}
      >
        Stop
      </label>
      <label
        style={{
          backgroundColor: clientStatus === "removed" ? "green" : "white"
        }}
        onClick={() => handleOptionClick("removed")}
      >
        Remove
      </label>

      {canKeepRunning && (
        <label
          style={{
            backgroundColor: clientStatus === "running" ? "green" : "white"
          }}
          onClick={() => handleOptionClick("running")}
        >
          Keep running
        </label>
      )}
    </div>
  );
}
