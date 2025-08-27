import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBackupNode } from "hooks/useBackupNode";
import { Card } from "react-bootstrap";
import Loading from "components/Loading";
import Button from "components/Button";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { relativePath } from "../data";
import { capitalize } from "utils/strings";
import { prettyDnpName } from "utils/format";
import {
  MdOutlineBackup,
  MdOutlineCheckCircleOutline,
  MdOutlineAccessTime,
  MdGroup,
  MdInfoOutline,
  MdErrorOutline
} from "react-icons/md";
import { SiEthereum } from "react-icons/si";
import newTabProps from "utils/newTabProps";
import { docsUrl } from "params";
import { relativePath as stakersPath } from "pages/stakers/data";

import "./backupNode.scss";

export function BackupNode({ isActivated: isPremium, hashedLicense }: { isActivated: boolean; hashedLicense: string }) {
  const {
    consensusLoading,
    currentConsensus,
    allPrysmOrTekuActive,
    anyPrysmOrTekuActive,
    backupStatusLoading,
    backupStatusError,
    backupActivable,
    backupActive,
    activateBackup,
    deactivateBackup,
    secondsUntilActivable,
    secondsUntilDeactivation,
    formatCountdown,
    activeValidatorsCounts,
    validatorLimit
  } = useBackupNode({ hashedLicense, isPremiumActivated: isPremium });
  const navigate = useNavigate();

  // Check if atleast on client is selected
  const noClientsSelected = !Object.values(currentConsensus).some((client) => client !== null && client !== undefined);

  // Check if validator limit exceeded in any network
  const valLimitExceeded = Object.values(activeValidatorsCounts).some((data) => data?.limitExceeded);

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
            <li>By default, it covers up to 10 validators per available network</li>
            <li>The backup service can be used once a month per user</li>
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
      <h5>
        Supported Active Networks{" "}
        <OverlayTrigger
          overlay={
            <Tooltip id="active-networks">
              The supported networks that have staking clients selected in order to use the backup node service
            </Tooltip>
          }
          placement="top"
        >
          <MdInfoOutline className="tooltip-icon" />
        </OverlayTrigger>
      </h5>

      <div className="premium-backup-network-list">
        {Object.entries(currentConsensus).map(([network, client]) => {
          const isPrysmOrTeku = client?.includes("prysm") || client?.includes("teku");
          return (
            client && (
              <div>
                <div className="premium-backup-network-item" key={network}>
                  <div>
                    {(network === "mainnet" || network === "hoodi") && <SiEthereum />}
                    <b>{capitalize(network)}</b>
                  </div>
                  <div className={`premium-backup-cc-tag ${isPrysmOrTeku && "color-danger"}`}>
                    {prettyDnpName(client)}
                  </div>
                </div>
              </div>
            )
          );
        })}
        {noClientsSelected && (
          <div className="premium-backup-network-item">
            <div>
              No staking clients selected. Set up your node in the <Link to={`/${stakersPath}`}> Stakers tab</Link>.
            </div>
          </div>
        )}
        {anyPrysmOrTekuActive && (
          <div className="premium-backup-network-warning">
            Prysm and Teku not supported. To enable the backup, switch to a different client in the{" "}
            <Link to={`/${stakersPath}`}> Stakers tab</Link>.
          </div>
        )}
      </div>
    </Card>
  );

  const ValidatorsCard = () => {
    return (
      <Card className="premium-backup-validators-card card">
        <h5>
          Validators Coverage by Network{" "}
          <OverlayTrigger
            overlay={
              <Tooltip id="validators-coverage">
                The number of active validators per network supported by the backup service
              </Tooltip>
            }
            placement="top"
          >
            <MdInfoOutline className="tooltip-icon" />
          </OverlayTrigger>
        </h5>

        <div className="premium-backup-validators-count">
          {Object.entries(activeValidatorsCounts).map(([network, data]) => {
            if (!data) return null;

            const count = data.count ?? 0;
            const exceeded = data.limitExceeded;
            const pct = validatorLimit ? Math.min((count / validatorLimit) * 100, 100) : 100;

            return (
              <div key={String(network)} className="premium-backup-validators-item">
                <div className="premium-backup-validators-count-row">
                  <strong className={exceeded ? "color-danger" : undefined}>{capitalize(network)}</strong>
                  <div>
                    <MdGroup /> <span className={exceeded ? "color-danger" : undefined}>{data.count ?? "0"}</span> /{" "}
                    {validatorLimit ?? "—"} validators
                  </div>
                </div>

                <div className="premium-backup-validators-limit-bar">
                  <div
                    className={`premium-backup-validators-curr-bar ${exceeded && "color-danger"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {valLimitExceeded ? (
            <div className="premium-backup-validators-limit-warning">
              You are exceeding the supported number of active validators in at least one network. We invite you to
              consolidate your validators to use this service.{" "}
              <Link to={docsUrl.premiumBackupValidatorsLimit} {...newTabProps}>
                Learn more
              </Link>
            </div>
          ) : (
            <div className="premium-backup-validators-limit-desc">
              Up to {validatorLimit ?? "—"} validators supported per network.
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
      <div>Your 7-day backup service is ready to cover your validators</div>

      <Button
        variant="dappnode"
        onClick={activateBackup}
        disabled={
          consensusLoading || backupStatusLoading || allPrysmOrTekuActive || valLimitExceeded || noClientsSelected
        }
      >
        Activate Backup
      </Button>
      {valLimitExceeded && <div className="color-danger">Validator limit exceeded</div>}
      {allPrysmOrTekuActive && <div className="color-danger">Clients are not supported</div>}
      {noClientsSelected && <div className="color-danger">No staking clients selected</div>}
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

  if (backupStatusError) {
    return (
      <div className="premium-backup-node">
        <DescriptionCard />
        <div className="premium-backup-info-cards">
          <NetworkCard />
          <ValidatorsCard />
        </div>
        <Card className="premium-backup-error-card card">
          <MdErrorOutline />
          <div>{backupStatusError}</div>
        </Card>
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
