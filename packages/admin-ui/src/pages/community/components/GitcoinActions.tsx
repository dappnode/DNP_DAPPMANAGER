import Button from "components/Button";
import React from "react";
import {explorerGitcoinUrl} from "params";
import newTabProps from "utils/newTabProps";

export default function GitcoinActions() {
  return (
    <>
      <Button href={explorerGitcoinUrl} {...newTabProps}>
        Go to grant page
      </Button>
    </>
  );
}
