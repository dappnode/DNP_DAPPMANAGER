import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBackupNode } from "hooks/useBackupNode";
import { Card } from "react-bootstrap";
import Loading from "components/Loading";
import Button from "components/Button";
import { relativePath } from "../data";
import { capitalize } from "utils/strings";
import { prettyDnpName } from "utils/format";
import { MdOutlineBackup, MdOutlineCheckCircleOutline, MdOutlineAccessTime, MdGroup } from "react-icons/md";
import { SiEthereum } from "react-icons/si";
import newTabProps from "utils/newTabProps";
import { docsUrl } from "params";
import "./backupNode.scss";

export function BackupNode({ isActivated: isPremium, hashedLicense }: { isActivated: boolean; hashedLicense: string }) {
  const {
    consensusLoading,
    currentConsensus,
    backupStatusLoading,
    backupActivable,
    backupActive,
    activateBackup,
    deactivateBackup,
    secondsUntilActivable,
    secondsUntilDeactivation,
    formatCountdown,
    activeValidators,
    activeValidatorLimit
  } = useBackupNode(hashedLicense);
  const navigate = useNavigate();

  const DescriptionCard = () => (
    <Card className="premium-backup-node-desc card">
      <div className="description-row">
        <div className="description-row-text">
          <p>
            The backup node for validators ensures that your imported validators in Dappnode stay up when you have
            problems attesting.
          </p>
          <ul>
            <li>Provides 7-day backup coverage to diagnose and fix issues</li>
            <li>Covers up to 10 validators among all available networks</li>
            <li>Once activated, backup is used regardless of later deactivation</li>
            <li>Service renews monthly</li>
          </ul>
        </div>
        {!isPremium && (
          <Button variant="dappnode" onClick={() => navigate("/" + relativePath)}>
            Activate Premium
          </Button>
        )}
      </div>
    </Card>
  );

  const NetworkCard = () => (
    <Card className="premium-backup-network-card card">
      <h5>Supported Active Networks</h5>

      <div className="premium-backup-network-list">
        {Object.entries(currentConsensus).map(
          ([network, client]) =>
            client && (
              <div className="premium-backup-network-item" key={network}>
                <div>
                  {(network === "mainnet" || network === "hoodi") && <SiEthereum />}
                  <b>{capitalize(network)}</b>
                </div>
                <div className="premium-backup-cc-tag">{prettyDnpName(client)}</div>
              </div>
            )
        )}
      </div>
    </Card>
  );

  const ValidatorsCard = () => {
    const validatorsPercentage = (activeValidators / activeValidatorLimit) * 100;
    const valLimitExceeded = activeValidators > activeValidatorLimit;
    return (
      <Card className="premium-backup-validators-card card">
        <h5>Validators Coverage</h5>

        <div className="premium-backup-validators-count">
          <div>
            <MdGroup /> <span className={`${valLimitExceeded && "color-danger"}`}> {activeValidators}</span> /{" "}
            {activeValidatorLimit} validators
          </div>
          <div className="premium-backup-validators-limit-bar">
            <div
              className={`premium-backup-validators-curr-bar ${valLimitExceeded && "color-danger"}`}
              style={{ width: `${validatorsPercentage}%` }}
            ></div>
          </div>

          <div className="premium-backup-validators-limit-desc">
            Up to {activeValidatorLimit} validators supported among all available networks.
          </div>
          {valLimitExceeded && (
            <div className="premium-backup-validators-limit-warning">
              You are exceeding the supported number of active validators to enable the backup. We invite you to
              consolidate your validators to use this service.{" "}
              <Link to={docsUrl.premiumBackupValidatorsLimit} {...newTabProps}>
                Learn more
              </Link>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const ActivateCard = () => (
    <Card className="premium-backup-action-card card">
      <MdOutlineBackup className="blue-text" />

      <h5 className="blue-text">Ready to activate</h5>
      <div>Your backup service is ready to use.</div>

      <Button variant="dappnode" onClick={activateBackup} disabled={consensusLoading || backupStatusLoading}>
        Activate Backup
      </Button>
    </Card>
  );

  const DeactiveCard = () => (
    <Card className="premium-backup-action-card card">
      <MdOutlineCheckCircleOutline className="green-text" />

      <h5 className="green-text">Backup Active</h5>
      <div>Your validators are protected by backup coverage</div>
      <div className="premium-backup-countdown">
        <div className="premium-backup-countdown-text">Auto-deactivation in:</div>
        <div className="premium-backup-countdown-time">
          <b>{formatCountdown(secondsUntilDeactivation)}</b>
        </div>
      </div>
      <Button variant="danger" onClick={deactivateBackup} disabled={consensusLoading || backupStatusLoading}>
        Stop Backup
      </Button>
    </Card>
  );

  const CooldownCard = () => (
    <Card className="premium-backup-action-card card">
      <MdOutlineAccessTime className="orange-text" />
      <h5 className="orange-text">Cooldown Period</h5>
      <div>Backup cannot be reactivated during cooldown</div>

      <div className="premium-backup-countdown">
        <div className="premium-backup-countdown-text">Available again in:</div>
        <div className="premium-backup-countdown-time">
          {" "}
          <b>{formatCountdown(secondsUntilActivable)}</b>
        </div>
      </div>

      <Button variant="dappnode" disabled={true}>
        Backup unavailable
      </Button>
    </Card>
  );

  if (consensusLoading || backupStatusLoading) {
    return <Loading steps={["Loading backup node data"]} />;
  }

  if (!isPremium) {
    return (
      <div className="premium-backup-node">
        <DescriptionCard />
        <div className="premium-backup-info-cards">
          <NetworkCard />
          <ValidatorsCard />
        </div>
      </div>
    );
  }

  return (
    <div className="premium-backup-node">
      {!backupActive && backupActivable && <DescriptionCard />}

      <div className="premium-backup-info-cards">
        <NetworkCard />
        <ValidatorsCard />
      </div>
      {backupActive ? <DeactiveCard /> : backupActivable ? <ActivateCard /> : <CooldownCard />}
    </div>
  );
}
