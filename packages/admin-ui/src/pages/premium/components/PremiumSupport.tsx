import React from "react";
import Button from "components/Button";
import { premiumSupportCalUrl } from "params";
import newTabProps from "utils/newTabProps";
import "./premiumSupport.scss";
import { Card } from "react-bootstrap";

export function PremiumSupport() {
  return (
    <div>
      <Card>
        <div className="premium-support-cont">
          <p>
            <b>4 personalized sessions</b> with Dappnode experts are included in your annual subscription. <br />
            Ensure to book the session with the same email you subscribed to Premium.
          </p>

          <div className="premium-support-actions">
            <Button variant="dappnode" href={premiumSupportCalUrl} {...newTabProps}>
              {" "}
              Book support session{" "}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
