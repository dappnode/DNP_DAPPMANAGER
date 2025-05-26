import React from "react";
import Button, { ButtonVariant } from "components/Button";

export default function BottomButtons({
  onBack,
  onNext,
  backTag = "Back",
  nextTag = "Next",
  backVariant = "outline-secondary",
  nextVariant = "dappnode",
  nextDisabled = false
}: {
  onBack?: () => void;
  onNext?: () => void;
  backTag?: string;
  nextTag?: string;
  backVariant?: ButtonVariant;
  nextVariant?: ButtonVariant;
  nextDisabled?: boolean;
}) {
  return (
    <div className="bottom-buttons">
      {onBack && (
        <Button onClick={onBack} variant={backVariant} className="back">
          {backTag}
        </Button>
      )}
      {onNext && (
        <Button onClick={onNext} variant={nextVariant} className="next" disabled={nextDisabled}>
          {nextTag}
        </Button>
      )}
    </div>
  );
}
