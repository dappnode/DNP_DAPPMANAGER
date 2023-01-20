import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { EthMultiClientsAndFallback } from "components/EthMultiClient";
import { EthClientFallback, Eth2ClientTarget } from "@dappnode/common";
import { getEthClientTarget } from "services/dappnodeStatus/selectors";
import BottomButtons from "../BottomButtons";
import { api } from "api";

/**
 * View to chose or change the Eth multi-client
 * There are three main options:
 * - Remote
 * - Full node
 * There may be multiple available light-clients and fullnodes
 */
export default function Repository({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  const ethClientTarget = useSelector(getEthClientTarget);
  const [useCheckpointSync, setUseCheckpointSync] = useState(true);
  const [target, setTarget] = useState<Eth2ClientTarget>("remote");
  // Use fallback by default
  const [fallback, setFallback] = useState<EthClientFallback>("on");

  useEffect(() => {
    if (ethClientTarget) setTarget(ethClientTarget);
  }, [ethClientTarget]);

  async function changeClient() {
    if (target) {
      api
        .ethClientTargetSet({
          target,
          useCheckpointSync
        })
        .catch(e => {
          console.error(`Error on ethClientTargetSet: ${e.stack}`);
        });
      // Only set the fallback if the user is setting a target
      // Otherwise, the fallback could be activated without the user wanting to
      if (fallback === "on")
        api.ethClientFallbackSet({ fallback }).catch(e => {
          console.error(`Error on ethClientFallbackSet: ${e.stack}`);
        });
    }
    onNext();
  }

  return (
    <>
      <div className="header">
        <div className="title">Repository Source</div>
        <div className="description">
          Dappnode uses smart contracts on the Ethereum Blockchain to provide access a decentralized respository of Official Dappnode Packages (DNPs) and publicly DApp Packages.
          <br />
          Choose to connect to a remote Ethereum Node or choose to use your own locally run Ethereum Node
        </div>
      </div>

      <EthMultiClientsAndFallback
        target={target}
        onTargetChange={setTarget}
        useCheckpointSync={useCheckpointSync}
        setUseCheckpointSync={setUseCheckpointSync}
        showStats
        fallback={fallback}
        onFallbackChange={setFallback}
      />

      <BottomButtons onBack={onBack} onNext={changeClient} />
    </>
  );
}
