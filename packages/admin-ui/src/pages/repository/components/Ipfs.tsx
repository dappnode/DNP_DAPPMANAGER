import React, { useState, useEffect } from "react";
import { useApi, api } from "api";
import { IpfsClientTarget } from "@dappnode/common";
import { withToast } from "components/toast/Toast";
import SubTitle from "components/SubTitle";
import { IpfsClient } from "components/IpfsClient";
import Button from "components/Button";
import Card from "components/Card";
import LinkDocs from "components/LinkDocs";
import { forumUrl } from "params";

export default function Ipfs() {
  const ipfsRepository = useApi.ipfsClientTargetGet();
  const [
    ipfsClientTarget,
    setIpfsClientTarget
  ] = useState<IpfsClientTarget | null>(null);
  const [ipfsGatewayTarget, setIpfsGatewayTarget] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (ipfsRepository.data)
      setIpfsClientTarget(ipfsRepository.data.ipfsClientTarget);
    if (ipfsRepository.data)
      setIpfsGatewayTarget(ipfsRepository.data.ipfsGateway);
  }, [ipfsRepository.data]);

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

  return (
    <Card className="dappnode-identity">
      <SubTitle>Ipfs</SubTitle>
      <div>
        DAppNode uses IPFS to distribute DAppNode packages in a decentrallized
        way. Choose to connect to a remote IPFS gateway or use your own local
        IPFS node. More information at:{" "}
        <LinkDocs href={forumUrl.ipfsRemoteHowTo}>
          How to use DAppNode IPFS remote
        </LinkDocs>
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
  );
}
