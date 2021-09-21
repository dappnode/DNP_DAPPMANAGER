import React from "react";
import "./multiClient.scss";
import { IpfsClientTarget } from "common";
import Card from "components/Card";
import { joinCssClass } from "utils/css";
import Input from "./Input";

interface IpfsClientData {
  title: string;
  description: string;
  option: IpfsClientTarget;
}

const clients: IpfsClientData[] = [
  {
    title: "Remote",
    description: "Public IPFS node API mantained by DAppNode",
    option: "remote"
  },
  {
    title: "Local",
    description: "Your own IPFS node w/out 3rd parties",
    option: "local"
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
  onGatewayTargetChange
}: {
  clientTarget: IpfsClientTarget | null;
  gatewayTarget: string | null;
  onClientTargetChange: (newTarget: IpfsClientTarget) => void;
  onGatewayTargetChange: (newTarget: string) => void;
}) {
  return (
    <div className="ipfs-multi-clients">
      {clients
        .filter(({ option }) => option.length > 0)
        .map(({ title, description, option }) => {
          const selected =
            selectedClientTarget && option === selectedClientTarget;

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
              <div className="description">{description}</div>

              {option === "remote" && (
                <Input
                  value={gatewayTarget || ""}
                  onValueChange={onGatewayTargetChange}
                />
              )}
            </Card>
          );
        })}
    </div>
  );
}
