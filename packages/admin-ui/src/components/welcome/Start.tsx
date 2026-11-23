import React from "react";
import Button from "components/Button";

export default function Start({
  onNext,
  onRestore
}: {
  onBack?: () => void;
  onNext: () => void;
  /** Only on a fresh node: skip the setup and restore a full backup instead */
  onRestore?: () => void;
}) {
  return (
    <>
      <div className="header">
        <div className="title">Some settings require your attention</div>
        <div className="description">Let's go ahead and set it up</div>
      </div>

      <Button className="big-centered-button" onClick={onNext} variant="dappnode">
        Start
      </Button>

      {onRestore && (
        <div className="welcome-restore">
          <div className="title">Reinstalling or moving from another Dappnode?</div>
          <div className="description">
            Restore a full backup to bring back your settings, identity and packages instead of setting them up again.
          </div>
          <Button className="big-centered-button" onClick={onRestore}>
            Restore from a backup
          </Button>
        </div>
      )}
    </>
  );
}
