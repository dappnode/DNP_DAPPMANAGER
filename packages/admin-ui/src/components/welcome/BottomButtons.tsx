import React from "react";
import Button from "components/Button";

export default function BottomButtons({
  onBack,
  onNext,
  backTag = "Back",
  nextTag = "Next",
  backVariant = "outline-secondary",
  nextVariant = "dappnode"
}: {
  onBack?: () => void;
  onNext?: () => void;
  backTag?: string;
  nextTag?: string;
  backVariant?: string;
  nextVariant?: string;
}) {
  return (
    <div className="bottom-buttons">
      {onBack && (
        <Button onClick={onBack} variant={backVariant} className="back">
          {backTag}
        </Button>
      )}
      {onNext && (
        <Button onClick={onNext} variant={nextVariant} className="next">
          {nextTag}
        </Button>
      )}
    </div>
  );
}
