import React, { useState, useEffect } from "react";
import { useApi, api } from "api";
import { toast } from "sonner";
import { IpfsClientTarget } from "@dappnode/types";
import { continueIfCalleDisconnected } from "api/utils";
import { ipfsDnpName } from "params";
import { prettyDnpName } from "utils/format";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Skeleton } from "components/primitives/skeleton";
import { Cloud, HardDrive } from "lucide-react";

export function IpfsClientSection() {
  const ipfsRepository = useApi.ipfsClientTargetGet();
  const packagesReq = useApi.packagesGet();
  const [clientTarget, setClientTarget] = useState<IpfsClientTarget | null>(null);
  const [gatewayTarget, setGatewayTarget] = useState("");

  const isIpfsInstalled = packagesReq.data?.some((p) => p.dnpName === ipfsDnpName) ?? false;

  useEffect(() => {
    if (ipfsRepository.data) {
      setClientTarget(ipfsRepository.data.ipfsClientTarget);
      setGatewayTarget(ipfsRepository.data.ipfsGateway || "");
    }
  }, [ipfsRepository.data]);

  async function changeIpfsClient() {
    if (!clientTarget) return;

    const switchingFromRemoteToLocal =
      ipfsRepository.data?.ipfsClientTarget === IpfsClientTarget.remote && clientTarget === IpfsClientTarget.local;

    // If switching to local but IPFS not installed, install it first
    if (switchingFromRemoteToLocal && !isIpfsInstalled) {
      const installToastId = toast.loading(`Installing ${prettyDnpName(ipfsDnpName)}...`);
      try {
        await continueIfCalleDisconnected(
          () =>
            api.packageInstall({
              name: ipfsDnpName,
              options: {
                BYPASS_CORE_RESTRICTION: true,
                BYPASS_SIGNED_RESTRICTION: true
              }
            }),
          ipfsDnpName
        )();
        toast.success(`Installed ${prettyDnpName(ipfsDnpName)}`, { id: installToastId });
        packagesReq.revalidate();
      } catch (e) {
        toast.error(`Install failed: ${e instanceof Error ? e.message : String(e)}`, { id: installToastId });
        return;
      }
    }

    const toastId = toast.loading(`Setting IPFS mode to ${clientTarget}...`);
    try {
      await api.ipfsClientTargetSet({
        ipfsRepository: {
          ipfsClientTarget: clientTarget,
          ipfsGateway: gatewayTarget
        }
      });
      toast.success(`IPFS mode changed to ${clientTarget}`, { id: toastId });
      ipfsRepository.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
    }
  }

  if (!ipfsRepository.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">IPFS Node</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="tw:h-20 tw:w-full" />
        </CardContent>
      </Card>
    );
  }

  const isUnchanged =
    ipfsRepository.data.ipfsClientTarget === clientTarget && ipfsRepository.data.ipfsGateway === gatewayTarget;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">IPFS Node</CardTitle>
        <CardDescription>
          Dappnode uses IPFS to distribute packages in a decentralized way. Choose between a remote gateway or your own
          local IPFS node.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
          <button
            onClick={() => setClientTarget(IpfsClientTarget.remote)}
            className={`tw:flex tw:items-start tw:gap-3 tw:rounded-lg tw:border tw:p-4 tw:text-left tw:bg-background tw:transition-colors ${
              clientTarget === IpfsClientTarget.remote
                ? "tw:border-primary tw:bg-primary/5"
                : "tw:border-border tw:hover:bg-muted/50"
            }`}
          >
            <Cloud className="tw:size-5 tw:mt-0.5 tw:shrink-0" />
            <div>
              <p className="tw:text-sm tw:font-medium">Remote</p>
              <p className="tw:text-xs tw:text-muted-foreground">
                Use a remote IPFS gateway (recommended for beginners)
              </p>
            </div>
          </button>
          <button
            onClick={() => setClientTarget(IpfsClientTarget.local)}
            className={`tw:flex tw:items-start tw:gap-3 tw:rounded-lg tw:border tw:p-4 tw:text-left tw:bg-background tw:transition-colors ${
              clientTarget === IpfsClientTarget.local
                ? "tw:border-primary tw:bg-primary/5"
                : "tw:border-border tw:hover:bg-muted/50"
            }`}
          >
            <HardDrive className="tw:size-5 tw:mt-0.5 tw:shrink-0" />
            <div>
              <p className="tw:text-sm tw:font-medium">Local</p>
              <p className="tw:text-xs tw:text-muted-foreground">
                Use your own local IPFS node
                {!isIpfsInstalled && " (will be installed)"}
              </p>
            </div>
          </button>
        </div>

        {clientTarget === IpfsClientTarget.remote && (
          <div className="tw:space-y-2">
            <Label htmlFor="ipfs-gateway">Gateway URL</Label>
            <Input
              id="ipfs-gateway"
              placeholder="https://gateway.ipfs.io"
              value={gatewayTarget}
              onChange={(e) => setGatewayTarget(e.target.value)}
            />
          </div>
        )}

        <Button disabled={isUnchanged || !clientTarget} onClick={changeIpfsClient}>
          Apply Changes
        </Button>
      </CardContent>
    </Card>
  );
}
