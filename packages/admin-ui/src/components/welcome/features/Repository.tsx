import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { EthMultiClientsAndFallback } from "components/EthMultiClient";
import { EthClientFallback, Eth2ClientTarget } from "@dappnode/types";
import {
  getEthClientTarget,
  getEthRemoteRpc
} from "services/dappnodeStatus/selectors";
import BottomButtons from "../BottomButtons";
import { api } from "api";

/**
 * View to choose or change the Eth multi-client
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
  const ethRemoteRpc = useSelector(getEthRemoteRpc);
  const [target, setTarget] = useState<Eth2ClientTarget>("remote");
  // Use fallback by default
  const [fallback, setFallback] = useState<EthClientFallback>("on");

  const [newEthRemoteRpc, setNewEthRemoteRpc] = useState<string>("");

  useEffect(() => {
    if (ethRemoteRpc) setNewEthRemoteRpc(ethRemoteRpc);
  }, [ethRemoteRpc]);

  useEffect(() => {
    if (ethClientTarget) setTarget(ethClientTarget);
  }, [ethClientTarget]);

  async function changeClient() {
    if (target) {
      api
        .ethClientTargetSet({
          target,
          ethRemoteRpc: newEthRemoteRpc
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
          Official DAppNode Packages (DNPs) and Community Packages (Public) are
          published in a decentralized repository. To access this repository,
          DAppNode uses smart contracts on the Ethereum Blockchain.
          <br />
          You can either connect to a remote Ethereum node maintained by
          DAppNode or easily run your own node to promote decentralization.
        </div>
      </div>

      <EthMultiClientsAndFallback
        target={target}
        onTargetChange={setTarget}
        newEthRemoteRpc={newEthRemoteRpc}
        setNewEthRemoteRpc={setNewEthRemoteRpc}
        showStats
        fallback={fallback}
        onFallbackChange={setFallback}
      />

      <BottomButtons onBack={onBack} onNext={changeClient} />
    </>
  );
}
