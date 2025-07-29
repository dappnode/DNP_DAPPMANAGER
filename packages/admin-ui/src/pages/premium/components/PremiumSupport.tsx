import React from "react";
import Button from "components/Button";
import { premiumSupportCalUrl } from "params";
import newTabProps from "utils/newTabProps";
import "./premiumSupport.scss";
import { Card } from "react-bootstrap";
import { relativePath } from "../data";
import { useNavigate } from "react-router-dom";

export function PremiumSupport({ isActivated }: { isActivated: boolean }) {
  const navigate = useNavigate();

  return (
    <div>
      <Card>
        <div className="premium-support-cont">
          <div>
            <p>
              Premium support includes <b>4 personalized sessions</b> with Dappnode experts in your annual subscription.{" "}
            </p>

            {isActivated ? (
              <div>Ensure to book the session with the same email you subscribed to Premium.</div>
            ) : (
              <div>Activate Premium to book personalized support sessions.</div>
            )}
          </div>

          <div className="premium-support-actions">
            {isActivated ? (
              <Button variant="dappnode" href={premiumSupportCalUrl} {...newTabProps}>
                {" "}
                Book support session{" "}
              </Button>
            ) : (
              <Button variant="dappnode" onClick={() => navigate("/" + relativePath)}>
                Activate Premium
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
