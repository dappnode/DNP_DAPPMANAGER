import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getEthClientTarget,
  getEthClientStatus,
  getEthClientFallback
} from "services/dappnodeStatus/selectors";
import { EthClientFallback, Eth2ClientTarget } from "types";
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
import { isEqual } from "lodash";

export default function Eth() {
  const ethClientTarget = useSelector(getEthClientTarget);
  const ethClientStatus = useSelector(getEthClientStatus);
  const ethClientFallback = useSelector(getEthClientFallback);
  const dispatch = useDispatch();

  const [target, setTarget] = useState<Eth2ClientTarget | null>(
    ethClientTarget || null
  );

  useEffect(() => {
    if (ethClientTarget) setTarget(ethClientTarget);
  }, [ethClientTarget]);

  function changeClient() {
    if (target) dispatch(changeEthClientTarget(target));
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
    <Card className="dappnode-identity">
      <SubTitle>Ethereum</SubTitle>
      <div>
        DAppNode uses smart contracts to access a decentralized respository of
        DApps. Choose to connect to a remote network or use your own local node
      </div>
      {ethClientTarget && ethClientTarget !== "remote" && (
        <div className="description">
          <strong>Execution Client:</strong>{" "}
          {prettyDnpName(ethClientTarget.execClient)}
          <strong>Consensu Client:</strong>{" "}
          {prettyDnpName(ethClientTarget.consClient)}
          <br />
          <strong>Status:</strong>{" "}
          {getEthClientPrettyStatus(ethClientStatus, ethClientFallback)}
        </div>
      )}

      {renderEthMultiClientWarning()}

      <EthMultiClientsAndFallback
        target={target}
        onTargetChange={setTarget}
        fallback={ethClientFallback || "off"}
        onFallbackChange={changeFallback}
      />

      <div style={{ textAlign: "end" }}>
        <Button
          variant="dappnode"
          onClick={changeClient}
          disabled={!target || isEqual(ethClientTarget, target)}
        >
          Change
        </Button>
      </div>
    </Card>
  );
}
