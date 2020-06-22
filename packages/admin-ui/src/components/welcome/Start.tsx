import React from "react";
import Button from "components/Button";

export default function Start({
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="header">
        <div className="title">Some settings require your attention</div>
        <div className="description">Let's go ahead and set it up</div>
      </div>

      <Button
        className="big-centered-button"
        onClick={onNext}
        variant="dappnode"
      >
        Start
      </Button>
    </>
  );
}
