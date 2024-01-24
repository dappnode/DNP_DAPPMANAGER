import React from "react";
import { docsUrl } from "params";
import BottomButtons from "../BottomButtons";

export default function SmoothWelcome({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {

  return (
    <>
      <div className="header">
        <div className="title">Smooth by Dappnode is here!</div>
        <div className="description">
        Smooth is a MEV Smoothing Pool designed to elevate the Ethereum solo staking experience.
        By pooling MEV rewards, Smooth offers Solo Stakers the unique opportunity to earn higher rewards consistently, 
        reducing reliance on luck and maximizing the potential of every staked ether. Join Smooth and take your solo staking experience to the next level!.{" "}
          <a href={docsUrl.ethicalMetricsOverview}>Learn more</a>
        </div>
      </div>
      <BottomButtons onBack={onBack} onNext={onNext} />
    </>
  );
}
