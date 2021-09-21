import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { api, useApi } from "api";
import Card from "components/Card";
import Button from "components/Button";
import {
  getEthClientPrettyName,
  getEthClientPrettyStatus,
  EthMultiClientsAndFallback
} from "components/EthMultiClient";
import { EthClientTarget, EthClientFallback } from "types";
import {
  getEthClientTarget,
  getEthClientFallback,
  getEthClientStatus
} from "services/dappnodeStatus/selectors";
import { changeEthClientTarget } from "pages/system/actions";
import Alert from "react-bootstrap/Alert";
import { withToastNoThrow, withToast } from "components/toast/Toast";
import { IpfsClient } from "components/IpfsClient";
import { IpfsClientTarget } from "common";
import SubTitle from "components/SubTitle";

export default function Repository() {
  // IPFS
  const ipfsRepository = useApi.ipfsClientTargetGet();
  const [
    ipfsClientTarget,
    setIpfsClientTarget
  ] = useState<IpfsClientTarget | null>(null);
  const [ipfsGatewayTarget, setIpfsGatewayTarget] = useState<string | null>(
    null
  );

  // ETH
  const ethClientTarget = useSelector(getEthClientTarget);
  const ethClientStatus = useSelector(getEthClientStatus);
  const ethClientFallback = useSelector(getEthClientFallback);
  const dispatch = useDispatch();

  const [target, setTarget] = useState<EthClientTarget | null>(
    ethClientTarget || null
  );

  // IPFS
  useEffect(() => {
    if (ipfsRepository.data)
      setIpfsClientTarget(ipfsRepository.data.ipfsClientTarget);
    if (ipfsRepository.data)
      setIpfsGatewayTarget(ipfsRepository.data.ipfsGateway);
  }, [ipfsRepository.data]);

  // ETH
  useEffect(() => {
    if (ethClientTarget) setTarget(ethClientTarget);
  }, [ethClientTarget]);

  // IPFS

  async function changeIpfsClient() {
    if (ipfsClientTarget && ipfsGatewayTarget)
      await withToast(
        () =>
          api.ipfsClientTargetSet({
            ipfsRepository: {
              ipfsClientTarget: ipfsClientTarget,
              ipfsGateway: ipfsGatewayTarget
            },
            deleteLocalIpfsClient: false
          }),
        {
          message: `Setting IPFS mode ${ipfsClientTarget}...`,
          onSuccess: `Successfully changed to ${ipfsClientTarget}`
        }
      );
    await ipfsRepository.revalidate();
  }

  // ETH

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
    <>
      <Card className="dappnode-identity">
        <SubTitle>Ethereum</SubTitle>
        <div>
          DAppNode uses smart contracts to access a decentralized respository of
          DApps. Choose to connect to a remote network or use your own local
          node
        </div>
        {ethClientTarget && ethClientTarget !== "remote" && (
          <div className="description">
            <strong>Client:</strong> {getEthClientPrettyName(ethClientTarget)}
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
            disabled={!target || ethClientTarget === target}
          >
            Change
          </Button>
        </div>
      </Card>
      <Card className="dappnode-identity">
        <SubTitle>Ipfs</SubTitle>
        <div>
          DAppNode uses IPFS to distribute DAppNode packages in a decentrallized
          way. Choose to connect to a remote IPFS gateway or use your own local
          IPFS node
        </div>
        {ipfsRepository.data ? (
          <>
            <IpfsClient
              clientTarget={ipfsClientTarget}
              onClientTargetChange={setIpfsClientTarget}
              gatewayTarget={ipfsGatewayTarget}
              onGatewayTargetChange={setIpfsGatewayTarget}
            />

            <div style={{ textAlign: "end" }}>
              <Button
                variant="dappnode"
                onClick={changeIpfsClient}
                disabled={
                  !ipfsClientTarget ||
                  (ipfsRepository.data.ipfsClientTarget === ipfsClientTarget &&
                    ipfsRepository.data.ipfsGateway === ipfsGatewayTarget)
                }
              >
                Change
              </Button>
            </div>
          </>
        ) : null}
      </Card>
    </>
  );
}
