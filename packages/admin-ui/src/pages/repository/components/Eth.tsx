import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getEthClientTarget,
  getEthClientStatus,
  getEthClientFallback
} from "services/dappnodeStatus/selectors";
import {
  EthClientFallback,
  Eth2ClientTarget,
  EthClientStatusToSet
} from "@dappnode/common";
import { changeEthClientTarget } from "pages/system/actions";
import { withToastNoThrow } from "components/toast/Toast";
import { api } from "api";
import SubTitle from "components/SubTitle";
import {
  getEthClientPrettyStatus,
  EthMultiClientsAndFallback
} from "components/EthMultiClient";
import Alert from "react-bootstrap/esm/Alert";
import Button from "components/Button";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { isEqual } from "lodash-es";
import RemoveClientsDialog from "./RemoveClientsDialog";

export default function Eth() {
  const currentEthClientTarget = useSelector(getEthClientTarget);
  const ethClientStatus = useSelector(getEthClientStatus);
  const ethClientFallback = useSelector(getEthClientFallback);
  const dispatch = useDispatch();
  const [newTarget, setNewTarget] = useState<Eth2ClientTarget | null>(
    currentEthClientTarget || null
  );
  const [useCheckpointSync, setUseCheckpointSync] = useState<boolean>(true); // TODO: Check this
  const [removeClientsDialogShown, setRemoveClientsDialogShown] = useState(
    false
  );
  const [prevExecClientStatus, setPrevExecClientStatus] = useState<
    EthClientStatusToSet
  >("running");

  const [prevConsClientStatus, setPrevConsClientStatus] = useState<
    EthClientStatusToSet
  >("running");

  useEffect(() => {
    if (currentEthClientTarget) {
      setNewTarget(currentEthClientTarget);
    }
  }, [currentEthClientTarget]);

  /**
   * Only shows the checkpointsync switch if ethclient target is
   * the fullnode and the user is changing the client.
   */
  useEffect(() => {
    if (newTarget !== "remote" && !isEqual(currentEthClientTarget, newTarget))
      setUseCheckpointSync(true);
  }, [newTarget, currentEthClientTarget]);

  function changeClient() {
    if (newTarget && !isEqual(newTarget, currentEthClientTarget)) {
      if (currentEthClientTarget === "remote") {
        dispatch(
          changeEthClientTarget(
            newTarget,
            prevExecClientStatus,
            prevConsClientStatus,
            useCheckpointSync
          )
        );
      } else {
        setRemoveClientsDialogShown(true); // changeEthClientTarget() called from RemoveClientsDialog
      }
    }
  }

  async function changeFallback(newFallback: EthClientFallback) {
    await withToastNoThrow(
      () => api.ethClientFallbackSet({ fallback: newFallback }),
      { onError: true }
    );
  }

  /**
   * There are a few edge cases which the user must be warned about
   *
   * 1. if (!dnp) && status !== "installed", "selected", "error-installing"
   *    NOT-OK Client should be installed
   *    Something or someone removed the client, re-install?
   *  > Show an error or something in the UI as
   *    "Alert!" you target is OFF, go to remote or install it again
   *
   * 2. if (!dnp.running)
   *    Package can be stopped because the user stopped it or
   *    because the DAppNode is too full and auto-stop kicked in
   *  > Show an error or something in the UI as
   *    "Alert!" you target is OFF, go to remote or install it again
   */
  function renderEthMultiClientWarning() {
    if (ethClientStatus && !ethClientStatus.ok)
      switch (ethClientStatus.code) {
        case "NOT_RUNNING":
          return (
            <Alert variant="warning">
              Selected client is not running. Please, restart the client or
              select remote
            </Alert>
          );
        case "NOT_INSTALLED":
        case "UNINSTALLED":
          return (
            <Alert variant="warning">
              Selected client is not installed. Please, re-install the client or
              select remote
            </Alert>
          );
      }
  }
  return (
    <>
      <Card className="dappnode-identity">
        <SubTitle>Ethereum</SubTitle>
        <div>
          DAppNode uses smart contracts to access a decentralized respository of
          DApps. Choose to connect to a remote network or use your own local
          node
        </div>
        {currentEthClientTarget && currentEthClientTarget !== "remote" && (
          <div className="description">
            <strong>Execution Client:</strong>{" "}
            {prettyDnpName(currentEthClientTarget.execClient)}
            <br />
            <strong>Consensus Client:</strong>{" "}
            {prettyDnpName(currentEthClientTarget.consClient)}
            <br />
            <strong>Status:</strong>{" "}
            {getEthClientPrettyStatus(ethClientStatus, ethClientFallback)}
          </div>
        )}

        {renderEthMultiClientWarning()}

        <EthMultiClientsAndFallback
          target={newTarget}
          onTargetChange={setNewTarget}
          fallback={ethClientFallback || "off"}
          onFallbackChange={changeFallback}
          useCheckpointSync={useCheckpointSync}
          setUseCheckpointSync={setUseCheckpointSync}
        />

        {!isEqual(currentEthClientTarget, newTarget) &&
          newTarget !== "remote" && (
            <Alert variant="warning">
              Be careful! Changing the full node clients will change your staker
              clients, too.
            </Alert>
          )}

        <div style={{ textAlign: "end" }}>
          <Button
            variant="dappnode"
            onClick={changeClient}
            disabled={!newTarget || isEqual(currentEthClientTarget, newTarget)}
          >
            Change
          </Button>
        </div>
      </Card>

      {newTarget &&
        currentEthClientTarget &&
        currentEthClientTarget !== "remote" && (
          <RemoveClientsDialog
            nextTarget={newTarget}
            useCheckpointSync
            prevExecClientStatus={prevExecClientStatus}
            prevConsClientStatus={prevConsClientStatus}
            prevTarget={currentEthClientTarget}
            removeClientsDialogShown={removeClientsDialogShown}
            setRemoveClientsDialogShown={setRemoveClientsDialogShown}
            setPrevExecClientStatus={setPrevExecClientStatus}
            setPrevConsClientStatus={setPrevConsClientStatus}
          />
        )}
    </>
  );
}
