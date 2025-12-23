import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import { StakerItem, StakerItemOk } from "@dappnode/types";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer";
import { useNavigate } from "react-router-dom";
import Input from "components/Input";
import { Form } from "react-bootstrap";

interface StarknetEnvs {
  signerOperationalAddress: string;
  signerPrivateKey: string;
}

export default function StarknetFullNode({
  fullNode,
  setNewFullNode,
  isSelected,
  starknetEnvs,
  onStarknetEnvsChange,
  isStakingApp,
  ...props
}: {
  fullNode: StakerItem;
  setNewFullNode: React.Dispatch<React.SetStateAction<StakerItemOk | null>>;
  isSelected: boolean;
  starknetEnvs?: StarknetEnvs;
  onStarknetEnvsChange?: (envs: StarknetEnvs) => void;
  isStakingApp?: boolean;
}) {
  const navigate = useNavigate();

  // Pattern validation for the operational address
  const addressPattern = /^0x[0-9a-fA-F]{1,64}$/;
  const isAddressValid = starknetEnvs?.signerOperationalAddress
    ? addressPattern.test(starknetEnvs.signerOperationalAddress)
    : true;

  return (
    <Card {...props} className={`starknet-node ${joinCssClass({ isSelected })}`} shadow={isSelected}>
      <div
        onClick={
          fullNode.status === "ok"
            ? isSelected
              ? () => setNewFullNode(null)
              : () => setNewFullNode(fullNode)
            : undefined
        }
      >
        {fullNode.status === "ok" ? (
          <div className="avatar">
            <img src={fullNode.avatarUrl || defaultAvatar} alt="avatar" />
          </div>
        ) : fullNode.status === "error" ? (
          <div className="avatar">
            <img src={errorAvatar} alt="avatar" />
          </div>
        ) : null}

        <div className="title">{prettyDnpName(fullNode.dnpName)} </div>
      </div>

      {fullNode.status === "ok" && isSelected && fullNode.isInstalled && !fullNode.isUpdated && (
        <>
          <Button
            onClick={() => navigate(`${getInstallerPath(fullNode.dnpName)}/${fullNode.dnpName}`)}
            variant="dappnode"
          >
            UPDATE
          </Button>
          <br />
          <br />
        </>
      )}

      {fullNode.status === "ok" && (
        <div className="description">{isSelected && fullNode.data?.manifest?.shortDescription}</div>
      )}

      {/* Starknet staking specific environment variables */}
      {isStakingApp && isSelected && starknetEnvs && onStarknetEnvsChange && (
        <div className="starknet-staking-envs" style={{ marginTop: "1rem" }}>
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Operational Address</strong>
              <span style={{ color: "red" }}> *</span>
            </Form.Label>
            <Form.Text className="text-muted d-block mb-2">
              Address used to sign attestations (Hot wallet).{" "}
              <a
                href="https://docs.dappnode.io/docs/user/staking/starknet/solo"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the docs
              </a>{" "}
              to learn how to get it.
            </Form.Text>
            <Input
              value={starknetEnvs.signerOperationalAddress}
              onValueChange={(value) => onStarknetEnvsChange({ ...starknetEnvs, signerOperationalAddress: value })}
              placeholder="0x..."
              isInvalid={starknetEnvs.signerOperationalAddress !== "" && !isAddressValid}
            />
            {starknetEnvs.signerOperationalAddress !== "" && !isAddressValid && (
              <Form.Text className="text-danger">Invalid contract address</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Private Key (Hex)</strong>
              <span style={{ color: "red" }}> *</span>
            </Form.Label>
            <Form.Text className="text-muted d-block mb-2">Internal signing private key (keep secure)</Form.Text>
            <Input
              type="password"
              value={starknetEnvs.signerPrivateKey}
              onValueChange={(value) => onStarknetEnvsChange({ ...starknetEnvs, signerPrivateKey: value })}
              placeholder="Enter private key"
            />
          </Form.Group>
        </div>
      )}
    </Card>
  );
}
