import React from "react";
import SubTitle from "components/SubTitle";
import Button from "components/Button";
import Card from "components/Card";
import { premiumSupportCalUrl } from "params";
import newTabProps from "utils/newTabProps";
export function PremiumSupport() {
  return (
    <div>
      <Card>
        <SubTitle>Premium Support</SubTitle>
        <p>
          <b>4 personalized sessions</b> with Dappnode experts are included in your annual subscription.
        </p>

        <div>
          <Button variant="dappnode" href={premiumSupportCalUrl} {...newTabProps}>
            {" "}
            Book support session{" "}
          </Button>
        </div>
      </Card>
    </div>
  );
}
