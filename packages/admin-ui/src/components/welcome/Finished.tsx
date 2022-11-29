import React from "react";
import Button from "components/Button";
import BottomButtons from "./BottomButtons";
import newTabProps from "utils/newTabProps";
import { docsUrl } from "params";

export default function Finished({
  onBack,
  onNext
}: {
  onBack: () => void;
  onNext?: () => void;
}) {
  return (
    <>
      <div className="header">
        <div className="title">All set!</div>
        <div className="description">
          Visit the{" "}
          <a href={docsUrl.main} {...newTabProps}>
            dappnode docs
          </a>{" "}
          for more info
        </div>
      </div>

      <Button
        className="big-centered-button"
        onClick={onNext}
        variant="dappnode"
      >
        Finish
      </Button>

      <BottomButtons onBack={onBack} />
    </>
  );
}
