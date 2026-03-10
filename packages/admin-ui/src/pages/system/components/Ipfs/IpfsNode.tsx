import React, { useState, useEffect } from "react";
import { useApi, api } from "api";
import { IpfsClientTarget } from "@dappnode/types";
import { withToast } from "components/toast/Toast";
import { IpfsClient } from "components/IpfsClient";
import Button from "components/Button";
import LinkDocs from "components/LinkDocs";
import { forumUrl, ipfsDnpName } from "params";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { continueIfCalleDisconnected } from "api/utils";
import { prettyDnpName } from "utils/format";

export default function IpfsNode({
  isIpfsInstalled,
  onIpfsInstalled
}: {
  isIpfsInstalled: boolean;
  onIpfsInstalled: () => Promise<unknown>;
}) {
  const ipfsRepository = useApi.ipfsClientTargetGet();
  const [ipfsClientTarget, setIpfsClientTarget] = useState<IpfsClientTarget | null>(null);
  const [ipfsGatewayTarget, setIpfsGatewayTarget] = useState<string | null>(null);

  useEffect(() => {
    if (ipfsRepository.data) setIpfsClientTarget(ipfsRepository.data.ipfsClientTarget);
    if (ipfsRepository.data) setIpfsGatewayTarget(ipfsRepository.data.ipfsGateway);
  }, [ipfsRepository.data]);

  async function changeIpfsClient() {
    if (!ipfsClientTarget || !ipfsGatewayTarget) return;

    const switchingFromRemoteToLocal =
      ipfsRepository.data?.ipfsClientTarget === IpfsClientTarget.remote && ipfsClientTarget === IpfsClientTarget.local;

    // If user is switching to Local but IPFS isn't installed, install it first.
    if (switchingFromRemoteToLocal && !isIpfsInstalled) {
      await withToast(
        continueIfCalleDisconnected(
          () =>
            api.packageInstall({
              name: ipfsDnpName,
              options: {
                BYPASS_CORE_RESTRICTION: true,
                BYPASS_SIGNED_RESTRICTION: true
              }
            }),
          ipfsDnpName
        ),
        {
          message: `Installing ${prettyDnpName(ipfsDnpName)}...`,
          onSuccess: `Installed ${prettyDnpName(ipfsDnpName)}`
        }
      );

      await onIpfsInstalled();
    }

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
      <SubTitle>IPFS Node</SubTitle>
      <div className="section-spacing">
        <Card>
          <div>
            Dappnode uses IPFS to distribute Dappnode packages in a decentralized way. Choose to connect to a remote
            IPFS gateway or use your own local IPFS node.
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
              localRequiresInstall={!isIpfsInstalled}
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
    </div>
  );
}
