import React, { useEffect, useState } from "react";
import "./launchpad-validators.scss";
import Button from "components/Button";
import { StakerItemOk } from "@dappnode/types";
import { StakerConfigGetOk, Network } from "@dappnode/types";
import { launchpadSteps } from "./LaunchpadSteps";

export default function LaunchpadValidators<T extends Network>({
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
    if (newExecClient && newConsClient) setNextEnabled(true);
    else setNextEnabled(false);
  }, [newExecClient, newConsClient]);

  const steps = launchpadSteps<T>({
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
