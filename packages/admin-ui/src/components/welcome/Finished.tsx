import React from "react";
import Button from "components/Button";
import BottomButtons from "./BottomButtons";
import newTabProps from "utils/newTabProps";

const userGuideUrl = "https://dappnode.github.io/DAppNodeDocs/what-can-you-do/";

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
          <a href={userGuideUrl} {...newTabProps}>
            user guide
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
