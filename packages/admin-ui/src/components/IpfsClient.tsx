import React from "react";
import "./multiClient.scss";
import { IpfsClientTarget } from "@dappnode/types";
import Card from "components/Card";
import { joinCssClass } from "utils/css";
import Input from "./Input";
import { IPFS_DAPPNODE_GATEWAY, IPFS_GATEWAY_CHECKER } from "params";
import RenderMarkdown from "./RenderMarkdown";

interface IpfsClientData {
  title: string;
  description: string;
  option: IpfsClientTarget;
}

const clients: IpfsClientData[] = [
  {
    title: "Remote",
    description: `Public IPFS node API mantained by Dappnode [${IPFS_DAPPNODE_GATEWAY}](${IPFS_DAPPNODE_GATEWAY}) or choose one from [${IPFS_GATEWAY_CHECKER}](${IPFS_GATEWAY_CHECKER})`,
    option: IpfsClientTarget.remote
  },
  {
    title: "Local",
    description: "Your own IPFS node w/out 3rd parties",
    option: IpfsClientTarget.local
  }
];

/**
 * View to chose or change the IPFS client
 * There are two main options:
 * - Remote
 * - Local
 */
export function IpfsClient({
  clientTarget: selectedClientTarget,
  gatewayTarget,
  onClientTargetChange,
  onGatewayTargetChange,
  localRequiresInstall = false
}: {
  clientTarget: IpfsClientTarget | null;
  gatewayTarget: string[] | null;
  onClientTargetChange: (newTarget: IpfsClientTarget) => void;
  onGatewayTargetChange: (newTarget: string[]) => void;
  localRequiresInstall?: boolean;
}) {
  return (
    <div className="ipfs-multi-clients">
      {clients
        .filter(({ option }) => option.length > 0)
        .map(({ title, description, option }) => {
          const selected = selectedClientTarget && option === selectedClientTarget;

          const showLocalInstallNotice = option === IpfsClientTarget.local && localRequiresInstall;

          return (
            <Card
              key={option}
              shadow
              className={`ipfs-multi-client ${joinCssClass({ selected })}`}
              onClick={() => {
                // Prevent over-riding the options onClientTargetChange call
                if (!selected) onClientTargetChange(option);
              }}
            >
              <div className="title">{title}</div>
              <div className="description">
                <RenderMarkdown source={description} />
              </div>

              {showLocalInstallNotice ? (
                <div className="description">
                  IPFS package isn&apos;t installed. Switching to <strong>Local</strong> will install it automatically.
                </div>
              ) : null}

              {option === "remote" && gatewayTarget && (
                <div className="ipfs-gateway-list">
                  {gatewayTarget.map((gateway, index) => (
                    <Input
                      key={index}
                      placeholder="https://ipfs-gateway.dappnode.net"
                      value={gateway}
                      onValueChange={(value) =>
                        onGatewayTargetChange(
                          gatewayTarget.map((currentGateway, currentIndex) =>
                            currentIndex === index ? value : currentGateway
                          )
                        )
                      }
                      append={
                        gatewayTarget.length > 1 ? (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            aria-label={`Remove gateway ${index + 1}`}
                            onClick={() => onGatewayTargetChange(gatewayTarget.filter((_, i) => i !== index))}
                          >
                            Remove
                          </button>
                        ) : undefined
                      }
                    />
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onGatewayTargetChange([...gatewayTarget, ""])}
                  >
                    Add gateway
                  </button>
                  <div className="description">Gateways are tried from top to bottom.</div>
                </div>
              )}
            </Card>
          );
        })}
    </div>
  );
}
