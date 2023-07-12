import React from "react";
import Button from "components/Button";

export default function BottomButtons({
  onBack,
  onNext,
  backTag = "Back",
  nextTag = "Next"
}: {
  onBack?: () => void;
  onNext?: () => void;
  backTag?: string;
  nextTag?: string;
}) {
  return (
    <div className="bottom-buttons">
      {onBack && (
        <Button onClick={onBack} color={"secondary"} className="back">
          {backTag}
        </Button>
      )}
      {onNext && (
        <Button onClick={onNext} color={"primary"} className="next">
          {nextTag}
        </Button>
      )}
    </div>
  );
}
