import React, { useState, useEffect } from "react";
import { useApi, api } from "api";
import { IpfsClientTarget } from "@dappnode/types";
import { withToast } from "components/toast/Toast";
import SubTitle from "components/SubTitle";
import { IpfsClient } from "components/IpfsClient";
import Button from "components/Button";
import LinkDocs from "components/LinkDocs";
import { forumUrl } from "params";
import Card from "components/Card";

export default function Ipfs() {
  const ipfsRepository = useApi.ipfsClientTargetGet();
  const [ipfsClientTarget, setIpfsClientTarget] = useState<IpfsClientTarget | null>(null);
  const [ipfsGatewayTarget, setIpfsGatewayTarget] = useState<string | null>(null);

  useEffect(() => {
    if (ipfsRepository.data) setIpfsClientTarget(ipfsRepository.data.ipfsClientTarget);
    if (ipfsRepository.data) setIpfsGatewayTarget(ipfsRepository.data.ipfsGateway);
  }, [ipfsRepository.data]);

  async function changeIpfsClient() {
    if (ipfsClientTarget && ipfsGatewayTarget)
      await withToast(
        () =>
          api.ipfsClientTargetSet({
            ipfsRepository: {
              ipfsClientTarget: ipfsClientTarget,
              ipfsGateway: ipfsGatewayTarget
            }
          }),
        {
          message: `Setting IPFS mode ${ipfsClientTarget}...`,
          onSuccess: `Successfully changed to ${ipfsClientTarget}`
        }
      );
    await ipfsRepository.revalidate();
  }

  return (
    <div className="dappnode-identity">
      <SubTitle>IPFS</SubTitle>
      <Card>
        <div>
          Dappnode uses IPFS to distribute Dappnode packages in a decentralized way. Choose to connect to a remote IPFS
          gateway or use your own local IPFS node.
        </div>
        <div>
          More information at: <LinkDocs href={forumUrl.ipfsRemoteHowTo}>How to use Dappnode IPFS remote</LinkDocs>
        </div>
      </Card>
      {ipfsRepository.data ? (
        <>
          <IpfsClient
            clientTarget={ipfsClientTarget}
            onClientTargetChange={setIpfsClientTarget}
            gatewayTarget={ipfsGatewayTarget}
            onGatewayTargetChange={setIpfsGatewayTarget}
          />

          <br />

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
    </div>
  );
}
