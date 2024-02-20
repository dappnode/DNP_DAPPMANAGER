import Button from "components/Button";
import React from "react";
import ConsensusClient from "../columns/ConsensusClient";
import ExecutionClient from "../columns/ExecutionClient";
import MevBoost from "../columns/MevBoost";
import { StakerConfigGetOk, StakerItemOk, Network } from "@dappnode/types";
import { disclaimer } from "pages/stakers/data";
import RenderMarkdown from "components/RenderMarkdown";
export const launchpadSteps = <T extends Network>({
  network,
  stakerConfig,
  setNewConfig,
  setShowLaunchpadValidators,
  setNewExecClient,
  newExecClient,
  setNewConsClient,
  newConsClient,
  setNewMevBoost,
  newMevBoost
}: {
  network: T;
  stakerConfig: StakerConfigGetOk<T>;
  setNewConfig(isLaunchpad: boolean): Promise<void>;
  setShowLaunchpadValidators: React.Dispatch<React.SetStateAction<boolean>>;
  setNewExecClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "execution"> | undefined>
  >;
  newExecClient?: StakerItemOk<T, "execution">;
  setNewConsClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "consensus"> | undefined>
  >;
  newConsClient?: StakerItemOk<T, "consensus">;
  newMevBoost: StakerItemOk<T, "mev-boost"> | undefined;
  setNewMevBoost: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "mev-boost"> | undefined>
  >;
}) => [
  {
    title: "Create the validator keystores and do the deposit",
    description: `To become a ${network.toUpperCase()} validator and participate in the network's Proof of Stake (PoS) consensus mechanism, you will need to create a validator keystore file and make a deposit of at least 32 ETH`,
    component: (
      <Button
        variant="dappnode"
        onClick={() => {
          window.open(
            network === "mainnet"
              ? "https://launchpad.ethereum.org/"
              : network === "prater"
              ? "https://goerli.launchpad.ethereum.org/"
              : network === "holesky"
              ? "https://launchpad.holesky.ethereum.org/"
              : network === "gnosis"
              ? "https://launchpad.gnosis.gateway.fm/"
              : network === "lukso"
              ? "https://deposit.mainnet.lukso.network/en/overview"
              : ""
          );
        }}
      >
        {network.toUpperCase()} Launchpad
      </Button>
    )
  },
  {
    title: "Select the Execution Client",
    description:
      "Select the execution client you want to use to run the validator node.",
    component: (
      <div className="launchpad-execution">
        {stakerConfig.executionClients.map((executionClient, i) => (
          <ExecutionClient<T>
            key={i}
            executionClient={executionClient}
            setNewExecClient={setNewExecClient}
            isSelected={executionClient.dnpName === newExecClient?.dnpName}
          />
        ))}
      </div>
    )
  },
  {
    title: "Select the Consensus Client",
    description:
      "Select the consensus client you want to use to run the validator node. The consensus client is the software that manages the validator keys and signs blocks.",
    component: (
      <div className="launchpad-consensus">
        {stakerConfig.consensusClients.map((consensusClient, i) => (
          <ConsensusClient<T>
            key={i}
            consensusClient={{ ...consensusClient, useCheckpointSync: true }}
            setNewConsClient={setNewConsClient}
            isSelected={consensusClient.dnpName === newConsClient?.dnpName}
          />
        ))}
      </div>
    )
  },
  {
    title: "Enable MEV boost and select its relays",
    description:
      "Select the MEV boost relays you want to use to run the validator node. The MEV boost relays are the software that executes the Ethereum 2.0 consensus protocol.",
    component: (
      <MevBoost
        network={network}
        mevBoost={stakerConfig.mevBoost}
        newMevBoost={newMevBoost}
        setNewMevBoost={setNewMevBoost}
        isSelected={stakerConfig.mevBoost.dnpName === newMevBoost?.dnpName}
      />
    )
  },
  {
    title: "Staker configuration summary",
    description: `This is a summary of the staker configuration you have selected. If you are happy with it, click on the "next" button.`,
    component: (
      <div className="launchpad-summary">
        {newExecClient && (
          <ExecutionClient<T>
            executionClient={newExecClient}
            setNewExecClient={setNewExecClient}
            isSelected={true}
          />
        )}
        {newConsClient && (
          <ConsensusClient<T>
            consensusClient={newConsClient}
            setNewConsClient={setNewConsClient}
            isSelected={true}
          />
        )}
        {newMevBoost && (
          <MevBoost
            network={network}
            mevBoost={newMevBoost}
            newMevBoost={newMevBoost}
            setNewMevBoost={setNewMevBoost}
            isSelected={true}
          />
        )}
      </div>
    )
  },
  {
    title: "Accept the terms and conditions",
    description: `By clicking on the "Launch validator node" button, you are accepting the terms and conditions of the ${network.toUpperCase()} Launchpad.`,
    component: (
      <>
        <div className="launchpad-terms">
          <RenderMarkdown source={disclaimer} />
        </div>
        <Button
          variant="dappnode"
          disabled={!newExecClient || !newConsClient}
          onClick={() => {
            setNewConfig(true);
            setShowLaunchpadValidators(false);
          }}
        >
          Launch validator node
        </Button>
      </>
    )
  }
];
