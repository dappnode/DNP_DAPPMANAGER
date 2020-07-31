import React, { useState } from "react";
import {
  fallbackToBoolean,
  booleanToFallback
} from "components/EthMultiClient";
import { EthClientFallback } from "types";
import BottomButtons from "../BottomButtons";
import { api } from "api";
import Alert from "react-bootstrap/Alert";
import SwitchBig from "components/SwitchBig";

/**
 * View to chose or change the Eth multi-client
 * There are three main options:
 * - Remote
 * - Light client
 * - Full node
 * There may be multiple available light-clients and fullnodes
 */
export default function RepositoryFallback({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  // Use fallback by default
  const [fallback, setFallback] = useState<EthClientFallback>("on");

  async function changeFallback() {
    if (fallback === "on")
      api.ethClientFallbackSet({ fallback }).catch(e => {
        console.error(`Error on ethClientFallbackSet: ${e.stack}`);
      });

    onNext();
  }

  return (
    <>
      <div className="header">
        <div className="title">Repository Fallback</div>
        <div className="description">
          DAppNode uses smart contracts to access a decentralized respository of
          DApps
          <br />
          Choose to use a remote node maintained by DAppNode Association if your
          node is not available (while syncing or failed)
        </div>
      </div>

      <div className="repository-fallback-switch">
        <SwitchBig
          checked={fallbackToBoolean(fallback)}
          onChange={bool => setFallback(booleanToFallback(bool))}
          label="Use remote during syncing or errors"
          id="repository-fallback-switch"
        />

        {fallback === "off" && (
          <Alert variant="warning">
            If your node is not available, you won't be able to update packages
            or access the DAppStore.
          </Alert>
        )}
      </div>

      <BottomButtons onBack={onBack} onNext={changeFallback} />
    </>
  );
}
