import React, { useEffect, useState } from "react";
import "./launchpad-validators.scss";
import Button from "components/Button";
import { StakerItem, StakerItemOk } from "@dappnode/common";
import { StakerConfigGetOk } from "@dappnode/common";
import { launchpadSteps } from "./LaunchpadSteps";
import { Network } from "@dappnode/types";

export default function LaunchpadValidators<T extends Network>({
  network,
  stakerConfig,
  setNewConfig,
  setShowLaunchpadValidators,
  setNewFeeRecipient,
  newFeeRecipient,
  newExecClient,
  setNewConsClient,
  newConsClient,
  setNewMevBoost,
  newMevBoost,
  feeRecipientError,
  handleExecutionClientCardClick,
  handleConsensusClientCardClick
}: {
  network: T;
  stakerConfig: StakerConfigGetOk<T>;
  setNewConfig(isLaunchpad: boolean): Promise<void>;
  setShowLaunchpadValidators: React.Dispatch<React.SetStateAction<boolean>>;
  setNewFeeRecipient: React.Dispatch<React.SetStateAction<string>>;
  newFeeRecipient: string;
  newExecClient?: StakerItemOk<T, "execution">;
  setNewConsClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "consensus"> | undefined>
  >;
  newConsClient?: StakerItemOk<T, "consensus">;
  newMevBoost: StakerItemOk<T, "mev-boost"> | undefined;
  setNewMevBoost: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "mev-boost"> | undefined>
  >;
  feeRecipientError: string | null;
  handleExecutionClientCardClick: (card: StakerItem<T, "execution">) => void,
  handleConsensusClientCardClick: (card: StakerItem<T, "consensus">) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [nextEnabled, setNextEnabled] = useState(false);
  const handleNextStep = () => {
    setStepIndex(prevIndex => prevIndex + 1);
  };
  const handlePrevStep = () => {
    setStepIndex(prevIndex => prevIndex - 1);
  };

  useEffect(() => {
    if (
      newExecClient &&
      newConsClient &&
      newFeeRecipient &&
      !Boolean(feeRecipientError)
    )
      setNextEnabled(true);
    else setNextEnabled(false);
  }, [newExecClient, newConsClient, newFeeRecipient, feeRecipientError]);

  const steps = launchpadSteps<T>({
    network,
    stakerConfig,
    setNewConfig,
    setShowLaunchpadValidators,
    setNewFeeRecipient,
    newFeeRecipient,
    newExecClient,
    setNewConsClient,
    newConsClient,
    setNewMevBoost,
    newMevBoost,
    feeRecipientError,
    handleExecutionClientCardClick,
    handleConsensusClientCardClick
  });

  const currentStep = steps[stepIndex];

  return (
    <div className="stakers-launchpad-container opacity-1">
      <div className="launchpad">
        <div className="header">
          <div className="title">{currentStep.title}</div>
          <div className="description">{currentStep.description}</div>
        </div>

        <div className="content">{currentStep.component}</div>

        <div className="bottom-buttons">
          <div className="left-buttons">
            {stepIndex !== 0 && (
              <Button
                onClick={handlePrevStep}
                variant="outline-secondary"
                className="back"
              >
                Back
              </Button>
            )}
            <Button
              onClick={() => setShowLaunchpadValidators(false)}
              variant="outline-secondary"
            >
              Cancel
            </Button>
          </div>

          {stepIndex !== steps.length - 1 && (
            <Button
              onClick={handleNextStep}
              disabled={!nextEnabled}
              variant="dappnode"
              className="next"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
