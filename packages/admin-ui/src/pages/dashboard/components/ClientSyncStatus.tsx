import React from "react";
import { Link } from "react-router-dom";
import { OverlayTrigger, ProgressBar, Tooltip } from "react-bootstrap";
import { MdInfoOutline, MdWarningAmber } from "react-icons/md";
import { ClientData, ClientError, ClientErrorReason, ClientResult, ClientSyncState } from "@dappnode/types";
import { relativePath as packagesRelativePath } from "pages/packages";
import { isClientError } from "hooks/useNetworkStats";
import { capitalize } from "utils/strings";

type Data = NonNullable<ClientData>;

const stateBadges: Record<ClientSyncState, { label: string; className: string }> = {
  synced: { label: "Synced", className: "synced" },
  syncing: { label: "Syncing", className: "syncing" },
  waiting: { label: "Waiting", className: "waiting" },
  stalled: { label: "Stalled", className: "stalled" }
};

const errorBadges: Record<ClientErrorReason, { label: string; className: string; explanation: string }> = {
  starting: {
    label: "Starting",
    className: "waiting",
    explanation:
      "The client is running but its API is not answering yet. It may be downloading a checkpoint or snapshot, or opening its database: this can take from minutes to hours."
  },
  stopped: { label: "Stopped", className: "offline", explanation: "The client's container is not running." },
  unresponsive: {
    label: "Not responding",
    className: "syncing",
    explanation: "The client is running but did not answer in time, often because it is busy syncing."
  }
};

/** "45 s", "12 min", "3 h 5 min", "2 d 4 h" */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
}

/** One line on what a client that is not synced is doing: phase, progress, distance and time left */
export function describeSync(data: Data): string {
  const parts: string[] = [];
  if (data.phase) parts.push(data.phase);
  if (typeof data.phaseProgress === "number") parts.push(`${data.phaseProgress}%`);
  if (data.behind) {
    const duration = data.behind.seconds !== undefined ? ` (${formatDuration(data.behind.seconds)})` : "";
    parts.push(`${data.behind.count.toLocaleString("en-US")} ${data.behind.unit} behind${duration}`);
  }
  if (data.etaSeconds !== undefined) parts.push(`about ${formatDuration(data.etaSeconds)} left`);
  return parts.join(" · ");
}

const DetailsTooltipContent = ({ data }: { data: Data }) => (
  <div className="sync-details-tooltip">
    {Object.entries(data.details ?? {}).map(([key, value]) => (
      <div key={key}>
        {key}: {String(value)}
      </div>
    ))}
  </div>
);

const ClientName = ({ dnpName, result }: { dnpName: string | null; result: ClientResult | null }) => {
  const name =
    result && !isClientError(result) && result.name
      ? capitalize(result.name)
      : dnpName
        ? capitalize(dnpName.split(".")[0].split("-")[0] ?? "-")
        : "-";
  return dnpName ? <Link to={`/${packagesRelativePath}/${dnpName}/info`}>{name}</Link> : <>{name}</>;
};

const ErrorBadge = ({ id, error }: { id: string; error: ClientError }) => {
  const badge = error.reason ? errorBadges[error.reason] : null;
  return (
    <OverlayTrigger
      overlay={
        <Tooltip id={id}>
          {badge ? `${badge.explanation} ` : ""}
          {error.error}
        </Tooltip>
      }
      placement="top"
    >
      <div>
        <div>
          <MdInfoOutline className="tooltip-icon" />
        </div>
        <div className={`badge-status ${badge?.className ?? "offline"}`}>{badge?.label ?? "Error"}</div>
      </div>
    </OverlayTrigger>
  );
};

const SyncBadge = ({ id, data, layer }: { id: string; data: Data; layer: "execution" | "consensus" }) => {
  const badge = stateBadges[data.state] ?? stateBadges[data.isSynced ? "synced" : "syncing"];
  const position = layer === "consensus" ? `Slot ${data.currentBlock}` : `Block #${data.currentBlock}`;
  return (
    <OverlayTrigger overlay={<Tooltip id={id}>{<DetailsTooltipContent data={data} />}</Tooltip>} placement="top">
      <div>
        <div>{position}</div>
        <div className={`badge-status ${badge.className}`}>{badge.label}</div>
      </div>
    </OverlayTrigger>
  );
};

/** Progress of a client that is not synced: a measured bar, or a moving bar when there is nothing to measure */
const SyncProgress = ({ data }: { data: Data }) => {
  if (data.state !== "syncing") return null;
  return typeof data.phaseProgress === "number" ? (
    <ProgressBar animated now={data.phaseProgress} />
  ) : (
    <ProgressBar animated striped now={100} className="indeterminate" />
  );
};

/**
 * One client row: name, peers, position and state, then what it is doing while not synced, work still
 * running after it synced, and problems worth flagging.
 */
export const ClientSyncStatus = ({
  label,
  layer,
  network,
  dnpName,
  result
}: {
  label: string;
  layer: "execution" | "consensus";
  network: string;
  dnpName: string | null;
  result: ClientResult | null;
}) => {
  const id = `${layer}-${network}`;
  const data = result && !isClientError(result) ? result : null;
  const error = result && isClientError(result) ? result : null;

  return (
    <div className="client-sync-status">
      <div className="status-client-row">
        <div className="network-stat-col">
          <div>{label}</div>
          <span>{result ? <ClientName dnpName={dnpName} result={result} /> : "-"}</span>
        </div>
        <div className="status-client-details">
          {data ? (
            <div className="network-stat-col">
              <div>PEERS</div>
              <span>{data.peers}</span>
            </div>
          ) : (
            <div />
          )}
          <div className="network-stat-col">
            {!result ? (
              <div className="badge-status waiting">Not installed</div>
            ) : error ? (
              <ErrorBadge id={`${id}-error`} error={error} />
            ) : data ? (
              <SyncBadge id={`${id}-details`} data={data} layer={layer} />
            ) : null}
          </div>
        </div>
      </div>

      {data && data.state !== "synced" && describeSync(data) && (
        <div className="client-sync-phase">{describeSync(data)}</div>
      )}
      {data && <SyncProgress data={data} />}
      {data?.state === "synced" && data.background && (
        <div className="client-sync-background">{data.background} in the background</div>
      )}
      {data?.issues && data.issues.length > 0 && (
        <div className="client-sync-issues">
          {data.issues.map((issue) => (
            <span key={issue} className="client-sync-issue">
              <MdWarningAmber /> {issue}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Whether the node can validate: both clients synced. Otherwise the first reason it cannot, so a staker
 * sees at once what to wait for.
 */
export function getReadiness(ec: ClientResult | null, cc: ClientResult | null): { ready: boolean; reason: string } {
  const describe = (layer: string, result: ClientResult | null): string | null => {
    if (!result) return `${layer} client not installed`;
    if (isClientError(result)) {
      return `${layer} client ${result.reason ? errorBadges[result.reason].label.toLowerCase() : "unreachable"}`;
    }
    if (result.state === "synced" || (!result.state && result.isSynced)) return null;
    const phase = result.phase ? result.phase.charAt(0).toLowerCase() + result.phase.slice(1) : "syncing";
    return result.state === "stalled" ? `${layer} client stalled: ${phase}` : `${layer} client ${phase}`;
  };
  const ccReason = describe("Consensus", cc);
  const ecReason = describe("Execution", ec);
  // A CC waiting for its EC is not the cause: the EC's own state is more useful
  const ccWaitsForEc = cc !== null && !isClientError(cc) && cc.state === "waiting";
  const reason = (ccWaitsForEc ? ecReason : null) ?? ccReason ?? ecReason;
  return reason ? { ready: false, reason } : { ready: true, reason: "Ready to validate" };
}
