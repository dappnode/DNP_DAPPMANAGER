import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { api } from "api";
import { getProgressLogsOfDnp } from "services/isInstallingLogs/selectors";
import { NexusProxyProbe, probeNexusPrivateMode } from "../api";

export const NEXUS_PROOFS_DNP_NAME = "nexus-proofs.dnp.dappnode.eth";
const NEXUS_MODELS_DOC_URL = "https://nexus.dappnode.com/docs/sdk/private-vs-anonymous-models";
const VERIFY_POLL_MS = 2_000;
// Covers a fresh install: the container starts, fetches the signed Gateway
// releases and verifies the attestation.
const VERIFY_TIMEOUT_MS = 90_000;

export type ProofsPhase =
  "checking" | "installing" | "starting" | "verifying" | "ready" | "missing" | "stopped" | "failed";

export interface NexusProofsState {
  phase: ProofsPhase | null;
  error: string | null;
  /** Install Nexus Proofs, start it if stopped, or check again. */
  fix: () => void;
}

/**
 * Walks Nexus Proofs to a verified state while confidentiality proofs are
 * wanted: checks it, installs or starts it when `autoFix` is set, and waits for
 * it to verify Nexus.
 *
 * `autoFix` is for the operator turning proofs on. When proofs are already on
 * and Nexus Proofs went away, the fix waits for an explicit click instead of
 * installing something the moment the editor opens.
 */
export function useNexusProofs(wanted: boolean, autoFix: boolean): NexusProofsState {
  const [phase, setPhase] = useState<ProofsPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);

  const verify = useCallback(async (id: number) => {
    setPhase("verifying");
    const deadline = Date.now() + VERIFY_TIMEOUT_MS;
    let probe: NexusProxyProbe | null = null;
    while (run.current === id) {
      probe = await probeNexusPrivateMode().catch(() => null);
      if (run.current !== id) return;
      if (probe?.verified) {
        setPhase("ready");
        return;
      }
      if (Date.now() > deadline) break;
      await new Promise((resolve) => setTimeout(resolve, VERIFY_POLL_MS));
    }
    if (run.current !== id) return;
    setError(`Nexus Proofs could not verify Nexus${probe?.reason ? `: ${probe.reason}` : "."}`);
    setPhase("failed");
  }, []);

  const check = useCallback(
    async (fix: boolean) => {
      const id = ++run.current;
      setError(null);
      setPhase("checking");
      try {
        const probe = await probeNexusPrivateMode();
        if (run.current !== id) return;
        if (probe.verified) return setPhase("ready");

        if (probe.installed === false) {
          if (!fix) return setPhase("missing");
          setPhase("installing");
          await api.packageInstall({ name: NEXUS_PROOFS_DNP_NAME });
        } else if (probe.installed && probe.running === false) {
          if (!fix) return setPhase("stopped");
          setPhase("starting");
          await api.packageStartStop({ dnpName: NEXUS_PROOFS_DNP_NAME });
        }
        if (run.current !== id) return;
        await verify(id);
      } catch (err) {
        if (run.current !== id) return;
        setError((err as Error).message || "Nexus Proofs could not be set up.");
        setPhase("failed");
      }
    },
    [verify]
  );

  useEffect(() => {
    if (!wanted) {
      run.current++;
      setPhase(null);
      setError(null);
      return;
    }
    void check(autoFix);
    // Only a change of intent restarts the walk; retries go through `fix`.
  }, [wanted]);

  useEffect(
    () => () => {
      run.current++;
    },
    []
  );

  return { phase, error, fix: () => void check(true) };
}

/**
 * Whether the chat is paused because proofs are on but Nexus Proofs is not
 * verified. Rechecked when proofs are turned on and after every chat error, so
 * a failing message explains itself instead of showing a bare upstream error.
 */
export function useProofsPaused(privateMode: boolean, recheck: unknown): boolean {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!privateMode) {
      setPaused(false);
      return;
    }
    let cancelled = false;
    probeNexusPrivateMode()
      .then((probe) => {
        if (!cancelled) setPaused(!probe.verified);
      })
      .catch(() => {
        if (!cancelled) setPaused(true);
      });
    return () => {
      cancelled = true;
    };
  }, [privateMode, recheck]);
  return paused;
}

export function ProofsPausedBanner({ onFix }: { onFix: () => void }) {
  return (
    <div className="nexus-proofs-paused" role="alert">
      <span>Confidentiality proofs are on, but Nexus Proofs is not ready, so the chat is paused.</span>
      <button type="button" className="nexus-private-mode-action" onClick={onFix}>
        Fix it
      </button>
    </div>
  );
}

export function ConfidentialityProofsField({
  checked,
  disabled,
  proofs,
  verificationUrl,
  onChange
}: {
  checked: boolean;
  disabled: boolean;
  proofs: NexusProofsState;
  verificationUrl: string;
  onChange: (checked: boolean) => void;
}) {
  const progressLogs = useSelector((state: Parameters<typeof getProgressLogsOfDnp>[0]) =>
    getProgressLogsOfDnp(state, NEXUS_PROOFS_DNP_NAME)
  );
  const installStep = progressLogs?.[NEXUS_PROOFS_DNP_NAME];

  return (
    <div className="nexus-key-editor-private-mode">
      <label className="nexus-private-mode-row">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span>Nexus confidentiality proofs</span>
      </label>

      {checked && proofs.phase && (
        <ProofsStatus proofs={proofs} installStep={installStep} verificationUrl={verificationUrl} />
      )}

      <p className="nexus-key-editor-text nexus-private-mode-help">
        Nexus runs in a TEE (Trusted Execution Environment) that proves your prompts stay confidential. Turn this on to
        receive the proofs in Nexus Proofs, which is installed for you if needed. For end-to-end confidentiality, use
        Private models.{" "}
        <a href={NEXUS_MODELS_DOC_URL} target="_blank" rel="noopener noreferrer">
          Anonymous vs. Private models
        </a>
      </p>
    </div>
  );
}

function ProofsStatus({
  proofs,
  installStep,
  verificationUrl
}: {
  proofs: NexusProofsState;
  installStep: string | undefined;
  verificationUrl: string;
}) {
  switch (proofs.phase) {
    case "checking":
      return <Pending>Checking Nexus Proofs...</Pending>;
    case "installing":
      return (
        <Pending>
          Installing Nexus Proofs...
          {installStep && <span className="nexus-private-mode-step">{installStep}</span>}
        </Pending>
      );
    case "starting":
      return <Pending>Starting Nexus Proofs...</Pending>;
    case "verifying":
      return <Pending>Nexus Proofs is verifying Nexus...</Pending>;
    case "ready":
      return (
        <p className="nexus-private-mode-status nexus-private-mode-status-ok">
          <strong>Verified.</strong> Your prompts are running in confidential infrastructure.{" "}
          <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
            See proofs
          </a>
        </p>
      );
    case "missing":
      return (
        <Problem action="Install Nexus Proofs" onAction={proofs.fix}>
          Nexus Proofs is not installed, so the chat is paused.
        </Problem>
      );
    case "stopped":
      return (
        <Problem action="Start Nexus Proofs" onAction={proofs.fix}>
          Nexus Proofs is stopped, so the chat is paused.
        </Problem>
      );
    case "failed":
      return (
        <Problem action="Try again" onAction={proofs.fix}>
          {proofs.error}
        </Problem>
      );
    default:
      return null;
  }
}

function Pending({ children }: { children: React.ReactNode }) {
  return (
    <p className="nexus-private-mode-status nexus-private-mode-status-pending" role="status">
      <span className="nexus-private-mode-spinner" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function Problem({ children, action, onAction }: { children: React.ReactNode; action: string; onAction: () => void }) {
  return (
    <div className="nexus-private-mode-status nexus-private-mode-status-bad" role="alert">
      <span>{children}</span>
      <button type="button" className="nexus-private-mode-action" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
