import React, { Dispatch, SetStateAction, useState } from "react";
import { buyPremiumUrl, premiumLanding, stripePortal } from "params";
import newTabProps from "utils/newTabProps";
import Button from "components/Button";
import Input from "components/Input";
import { Card } from "react-bootstrap";
import "./activatePremium.scss";
import Loading from "components/Loading";
interface ActivatePremiumProps {
  isActivated: boolean;
  licenseKey: string;
  setLicenseKey: Dispatch<SetStateAction<string>>;
  handleActivate: () => Promise<void>;
  handleDectivate: () => Promise<void>;
  isActivationLoading: boolean;
}

export const ActivatePremium = ({
  isActivated,
  licenseKey,
  setLicenseKey,
  handleActivate,
  handleDectivate,
  isActivationLoading
}: ActivatePremiumProps) => {
  if (isActivationLoading) {
    return <Loading steps={["Loading Activation"]} />;
  }

  return (
    <div className="premium-activate-cont">
      {isActivated ? (
        <>
          <StripePortalCard />
          <DeactivateCard licenseKey={licenseKey} handleDectivate={handleDectivate} />
        </>
      ) : (
        <>
          <InfoCard />
          <ActivateCard licenseKey={licenseKey} setLicenseKey={setLicenseKey} handleActivate={handleActivate} />
        </>
      )}
    </div>
  );
};

const InfoCard: React.FC = () => {
  const features: { title: string; description: string; icon: JSX.Element }[] = [
    {
      title: "Advanced Notifications",
      description:
        "Monitor your hardware, validators and packages at any moment with instant notifications in your phone.",
      icon: <span>🔔</span>
    },
    {
      title: "Premium Support",
      description:
        "Talk to a Dappnode expert to solve your issues and receive personalized guidance on your staking process.",
      icon: <span>💬</span>
    },
    {
      title: "Backup node for validators",
      description:
        "Use our backup to keep your validators attesting for 7 days in case you find issues in your staking setup.",
      icon: <span>📀</span>
    }
  ];

  return (
    <Card className="left-card">
      <div className="premium-info premium-card">
        <h5>What is included in Dappnode Premium?</h5>
        <div className="premium-features-col">
          {features.map((feature, i) => (
            <div key={i} className="premium-feature">
              <div className="premium-feature-icon">{feature.icon}</div>
              <div className="premium-feature-text">
                <div>
                  <strong>{feature.title}</strong>
                </div>
                <div> {feature.description}</div>
              </div>
            </div>
          ))}
          {
            <>
              <div className="premium-features-pricing">
                <div>
                  <b>12.99 € / month</b>
                  <div>
                    <i> Billed monthly</i>
                  </div>
                </div>

                <div>or</div>
                <div>
                  <b>9.99 € / month</b>
                  <div>
                    <i> Billed annually</i>
                  </div>
                </div>
              </div>
              <div className="premium-features-cta">
                <Button variant="outline-dappnode" href={premiumLanding} {...newTabProps}>
                  Visit Web
                </Button>
                <Button variant="dappnode" href={buyPremiumUrl} {...newTabProps}>
                  Get Premium
                </Button>
                <div className="premium-trial-tag">
                  15 day <br />
                  free trial!
                </div>
              </div>
            </>
          }
        </div>
      </div>
    </Card>
  );
};

const ActivateCard: React.FC<{
  licenseKey: string;
  setLicenseKey: Dispatch<SetStateAction<string>>;
  handleActivate: () => Promise<void>;
}> = ({ licenseKey, setLicenseKey, handleActivate }) => {
  const [localLicenseKey, setLocalLicenseKey] = useState(licenseKey);

  const handleInputChange = (newValue: string) => {
    setLocalLicenseKey(newValue);
  };

  const handleBlur = () => {
    setLicenseKey(localLicenseKey);
  };

  return (
    <Card className="right-card">
      <div className="premium-card">
        <h5>Activate Premium subscription</h5>
        <div className="premium-activate">
          <div>Activate the subscription with the activation code sent to your email.</div>
          <div>
            <b>Activation code:</b>
            <Input
              type="text"
              onValueChange={handleInputChange}
              value={localLicenseKey}
              onBlur={handleBlur}
              placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX"
            />
          </div>
          <Button
            variant="dappnode"
            onClick={handleActivate}
            disabled={!localLicenseKey}
          >
            Activate
          </Button>
        </div>
      </div>
    </Card>
  );
};

const DeactivateCard: React.FC<{
  licenseKey: string;
  handleDectivate: () => Promise<void>;
}> = ({ licenseKey, handleDectivate }) => {
  return (
    <Card>
      <div className="premium-card">
        <h5>Deactivate Premium license</h5>
        <div className="premium-activate">
          <div>Your activation code can only be used on one Dappnode at a time.</div>
          <div>Before using your license on a different Dappnode, you have to deactivate it on this device.</div>
          <div>
            <b>Activation code:</b> {licenseKey}
          </div>
          <Button variant="danger" onClick={handleDectivate}>
            Deactivate
          </Button>
        </div>
      </div>
    </Card>
  );
};

const StripePortalCard: React.FC = () => {
  return (
    <Card className="max-h">
      <div className="premium-card">
        <div className="premium-stripe-portal">
          <h5>Manage Premium subscription</h5>
          <div>To update, cancel, or renew your Dappnode premium subscription, visit the Stripe Customer Portal.</div>
          <div>Log in using the email you used to subscribe.</div>
          <Button href={stripePortal} {...newTabProps} variant="dappnode">
            Visit Stripe Portal
          </Button>
        </div>
      </div>
    </Card>
  );
};
