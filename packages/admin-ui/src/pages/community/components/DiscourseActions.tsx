import React from "react";
import Button from "components/Button";
import { dappnodeDiscourse } from "params";

export default function DiscourseActions() {
  return (
    <Button onClick={() => window.open(dappnodeDiscourse)}>
      Join Discourse
    </Button>
  );
}
