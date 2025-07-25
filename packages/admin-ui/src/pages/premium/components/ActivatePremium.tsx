import React, { useState } from "react";
import { IconType } from "react-icons";
import { docsUrl, premiumLanding, stripeDashboard } from "params";
import newTabProps from "utils/newTabProps";
import Button from "components/Button";
import Input from "components/Input";
import { Card } from "react-bootstrap";
import "./activatePremium.scss";

interface ActivatePremiumProps {
  isActivated: boolean;
}

export function ActivatePremium({ isActivated }: ActivatePremiumProps) {
  const [activationCode, setActivationCode] = useState<string>("");
  const handleCodeChange = (newValue: string) => {
    setActivationCode(newValue);
  };

  const features: { title: string; description: string; icon: IconType }[] = [
    {
      title: "Advanced Notifications",
      description:
        "Monitor your hardware, validators and packages at any moment with instant notifications in your phone.",
      icon: () => <span>🔔</span> // Replace with actual icon component
    },
    {
      title: "Premium Support",
      description:
        "Talk to a Dappnode expert to solve your issues and receive personalized guidance on your staking process.",
      icon: () => <span>💬</span> // Replace with actual icon component
    },
    {
      title: "Beacon Node Backup",
      description:
        "Use our backup to keep your validators attesting for 7 days in case you find issues in your staking setup.",
      icon: () => <span>📀</span> // Replace with actual icon component
    }
  ];

  const InfoCard = () => (
    <Card>
      <div className="premium-info premium-card">
        <h5>What is included in Dappnode Premium?</h5>
        <div className="premium-features-col">
          {features.map((feature, i) => (
            <div key={i} className="premium-feature">
              <div className="premium-feature-icon">
                <feature.icon />
              </div>
              <div className="premium-feature-text">
                <div>
                  <strong>{feature.title}:</strong>
                </div>
                <div> {feature.description}</div>
              </div>
            </div>
          ))}
          {isActivated ? (
            <div className="premium-features-cta">
              <Button variant="outline-dappnode" href={docsUrl.premiumOverview} {...newTabProps}>
                Read Docs
              </Button>
            </div>
          ) : (
            <>
              <div className="premium-features-pricing">
                <div>
                  <b>$12.99 / month</b>
                  <div>
                    <i> Billed monthly</i>
                  </div>
                </div>

                <div>or</div>
                <div>
                  <b>$9.99 / month</b>
                  <div>
                    <i> Billed annually</i>
                  </div>
                </div>
              </div>
              <div className="premium-features-cta">
                <Button variant="outline-dappnode" href={premiumLanding} {...newTabProps}>
                  Visit Web
                </Button>
                <Button variant="dappnode" href={stripeDashboard} {...newTabProps}>
                  Get Premium
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  const ActivateCard = () => {
    return (
      <Card>
        <div className="premium-card">
          <h5>Activate Premium subscription</h5>
          <div className="premium-activate">
            <div>Activate the subscription with the same email in which you received the activation code. </div>
            <div>
              <b>Activation code:</b>
              <Input
                type="text"
                onValueChange={handleCodeChange}
                value={activationCode}
                placeholder="xxx-xxx-xxx-xxx-xxx"
              />
            </div>
            <Button variant="dappnode" onClick={() => console.log("Activate premium")}>
              Activate
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const DeactivateCard = () => {
    return (
      <Card>
        <div className="premium-card">
          <h5>Deactivate Premium subscription</h5>
          <div className="premium-activate">
            <div>Before using your license key on a different Dappnode, you have to deactivate it on this device. </div>
            <div>
              <b>Activation code:</b>
              <Input
                type="text"
                onValueChange={() => {}}
                value={activationCode}
                lock={true}
                placeholder="xxx-xxx-xxx-xxx-xxx"
              />
            </div>
            <Button variant="dappnode" onClick={() => console.log("Activate premium")}>
              Deactivate
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="premium-activate-cont">
      <InfoCard />
      {isActivated ? <DeactivateCard /> : <ActivateCard />}
    </div>
  );
}
