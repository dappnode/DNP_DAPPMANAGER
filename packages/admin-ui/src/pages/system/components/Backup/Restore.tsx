import React, { useEffect, useState } from "react";
import Alert from "react-bootstrap/esm/Alert";
import Form from "react-bootstrap/esm/Form";
import ProgressBar from "react-bootstrap/esm/ProgressBar";
import Table from "react-bootstrap/esm/Table";
import { api, apiRoutes, useApi } from "api";
import {
  FullBackupInspectResult,
  FullBackupRestoreMode,
  FullBackupRestorePackagePlan,
  FullBackupRestoreStatus
} from "@dappnode/types";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import { InputForm } from "components/InputForm";
import { prettyBytes, prettyDnpName } from "utils/format";

const actionLabels: Record<FullBackupRestorePackagePlan["action"], string> = {
  install: "Install",
  update: "Update",
  "apply-settings": "Apply settings",
  "keep-newer": "Keep newer version",
  skip: "Skip",
  remove: "Remove"
};

const modeDescriptions: Record<FullBackupRestoreMode, string> = {
  merge:
    "Install the backup's packages on this node. This node keeps its identity, admin login, settings and the data of packages it already has.",
  clone:
    "Make this node a copy of the backed-up one: identity, admin login, settings and package data. Packages that are not in the backup are removed (their volumes are kept). The old node must stay off."
};

/** A backup file uploaded to this Dappnode, kept so a wrong password can be retried without uploading it again */
interface UploadedBackup {
  fileId: string;
  name: string;
  size: number;
  uploadedAt: number;
}

const UPLOAD_STORAGE_KEY = "full-backup-restore-upload";
// The Dappnode deletes uploads after 30 minutes: forget them a bit earlier
const UPLOAD_TTL_MS = 25 * 60 * 1000;

/** The upload of this browser tab, also after a reload */
function loadUpload(): UploadedBackup | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(UPLOAD_STORAGE_KEY) ?? "null");
    if (saved && typeof saved.fileId === "string" && Date.now() - saved.uploadedAt < UPLOAD_TTL_MS) return saved;
  } catch {
    // Storage unavailable: the file is uploaded again
  }
  return null;
}

function saveUpload(upload: UploadedBackup | null): void {
  try {
    if (upload) sessionStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(upload));
    else sessionStorage.removeItem(UPLOAD_STORAGE_KEY);
  } catch {
    // Storage unavailable: the upload is kept for this page view only
  }
}

function formatAuthError(e: Error): Error {
  return e.message === "WRONG_CREDENTIALS" ? Error("Wrong admin password") : e;
}

function PlanTable({ packages }: { packages: FullBackupRestorePackagePlan[] }) {
  return (
    <div className="full-backup-plan">
      <Table size="sm" responsive>
        <thead>
          <tr>
            <th>Package</th>
            <th>Action</th>
            <th>Backup</th>
            <th>This node</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.dnpName} className={pkg.action === "skip" ? "full-backup-plan-skip" : undefined}>
              <td>
                {prettyDnpName(pkg.dnpName)}
                {pkg.validator && <span className="full-backup-tag">validator</span>}
                {pkg.reason && <div className="full-backup-note">{pkg.reason}</div>}
              </td>
              <td>{actionLabels[pkg.action]}</td>
              <td>{pkg.backupVersion ?? "-"}</td>
              <td>{pkg.installedVersion ?? "-"}</td>
              <td>{pkg.restoreData ? "Restored" : "-"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function RestorePlan({
  inspected,
  fileId,
  password,
  onStarted
}: {
  inspected: FullBackupInspectResult;
  fileId: string;
  password: string;
  onStarted: () => void;
}) {
  const [mode, setMode] = useState<FullBackupRestoreMode>(inspected.suggestedMode);
  const [validatorsOff, setValidatorsOff] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const plan = inspected.plans[mode];
  const blocked = inspected.blockers.length > 0;
  const canStart =
    !blocked && Boolean(adminPassword) && (!inspected.requiresValidatorConfirmation || validatorsOff) && !starting;

  async function onStart() {
    if (!canStart) return;
    try {
      setStarting(true);
      setError(null);
      await apiRoutes.restoreFullBackup({ adminPassword, fileId, password, mode, confirmValidatorsOff: validatorsOff });
      onStarted();
    } catch (e) {
      setError(formatAuthError(e));
      setStarting(false);
    }
  }

  return (
    <>
      <p>
        Backup from {new Date(inspected.createdAt).toLocaleString()}, {inspected.packageCount} packages, dappmanager{" "}
        {inspected.dappmanagerVersion ?? "unknown version"} ({inspected.arch}).
      </p>
      {inspected.blockers.map((blocker) => (
        <Alert key={blocker} variant="danger">
          {blocker}
        </Alert>
      ))}

      <Form.Group className="full-backup-modes">
        {(["merge", "clone"] as const).map((option) => (
          <Form.Check
            key={option}
            type="radio"
            id={`full-backup-mode-${option}`}
            name="full-backup-mode"
            checked={mode === option}
            onChange={() => setMode(option)}
            label={
              <>
                <b>{option === "merge" ? "Restore packages" : "Exact clone"}</b>
                {inspected.suggestedMode === option && <span className="full-backup-tag">suggested</span>}
                <div className="full-backup-note">{modeDescriptions[option]}</div>
              </>
            }
          />
        ))}
      </Form.Group>

      <PlanTable packages={plan.packages} />

      {plan.warnings.length > 0 && (
        <Alert variant="warning">
          <ul>
            {plan.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}
      {plan.restoresAdminLogin && (
        <Alert variant="info">
          After the restore, log in with the admin password of the backed-up node. A backup of this node is taken before
          anything changes.
        </Alert>
      )}

      {inspected.requiresValidatorConfirmation && (
        <Alert variant="danger">
          <Form.Check
            type="checkbox"
            id="full-backup-validators-off"
            checked={validatorsOff}
            onChange={(e) => setValidatorsOff(e.target.checked)}
            label="This backup contains validator keys. I confirm the old node is switched off and will stay off: running the same keys on two nodes gets validators slashed. Validator packages stay stopped after the restore until I start them."
          />
        </Alert>
      )}

      <InputForm
        fields={[
          {
            label: "Admin password (to confirm it's you)",
            labelId: "full-backup-restore-admin-password",
            name: "current-password",
            autoComplete: "current-password",
            secret: true,
            value: adminPassword,
            onValueChange: setAdminPassword
          }
        ]}
      >
        <Button type="submit" variant="dappnode" onClick={onStart} disabled={!canStart}>
          {starting ? "Verifying backup..." : "Start restore"}
        </Button>
      </InputForm>
      {error && <ErrorView error={error} hideIcon red />}
    </>
  );
}

const stepIcons: Record<string, string> = {
  pending: "○",
  running: "…",
  done: "✓",
  failed: "✗",
  skipped: "–"
};

function RestoreProgress({ status }: { status: FullBackupRestoreStatus }) {
  const finished = status.status === "done" || status.status === "failed";
  // Only a clone replaces the admin login, as its last step
  const adminLoginRestored =
    status.mode === "clone" && status.steps.some((s) => s.id === "admin-login" && s.status === "done");
  const doneCount = status.steps.filter((s) => s.status === "done" || s.status === "skipped").length;
  return (
    <div className="full-backup-progress">
      {!finished && <ProgressBar now={(100 * doneCount) / Math.max(status.steps.length, 1)} animated />}
      <ul className="full-backup-steps">
        {status.steps.map((s) => (
          <li key={s.id} className={`full-backup-step-${s.status}`}>
            <span className="full-backup-step-icon">{stepIcons[s.status]}</span> {s.title}
            {s.error && <div className="full-backup-note">{s.error}</div>}
          </li>
        ))}
      </ul>
      {status.status === "done" && <Alert variant="success">Restore finished.</Alert>}
      {status.status === "failed" && (
        <Alert variant="danger">The restore did not complete. Check the failed steps above.</Alert>
      )}
      {adminLoginRestored && (
        <Alert variant="info">
          The admin login was restored. From now on, log in with the admin password of the backed-up node.
        </Alert>
      )}
      {status.stoppedValidators.length > 0 && (
        <Alert variant="warning">
          These validator packages were restored and left stopped:{" "}
          {status.stoppedValidators.map(prettyDnpName).join(", ")}. Start them from their package page once you are sure
          the old node is off.
        </Alert>
      )}
      {status.warnings.length > 0 && (
        <Alert variant="warning">
          <ul>
            {status.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}
      {status.safetySnapshot && (
        <div className="full-backup-note">
          A backup of this node from before the restore is at {status.safetySnapshot}, encrypted with the same password
          as the restored backup.
        </div>
      )}
    </div>
  );
}

export function FullBackupRestore() {
  const statusRes = useApi.fullBackupRestoreStatus();
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploadedState] = useState<UploadedBackup | null>(loadUpload);
  const [password, setPassword] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [inspected, setInspected] = useState<{ result: FullBackupInspectResult; fileId: string } | null>(null);
  const [started, setStarted] = useState(false);
  // startedAt of the finished restore the user left to restore another backup
  const [dismissed, setDismissed] = useState<string | null>(null);

  const status = statusRes.data;
  const running = status?.status === "running";
  // The last restore is shown until the user leaves it, also after a reload:
  // its result is the only place that lists what failed and what was left stopped
  const job = status && status.status !== "idle" && (running || (status.startedAt ?? "") !== dismissed) ? status : null;
  // Poll while a restore runs, or until the one just started shows up
  const polling = running || (started && !job);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => statusRes.revalidate(), 2000);
    return () => clearInterval(interval);
  }, [polling, statusRes]);

  function setUploaded(upload: UploadedBackup | null) {
    saveUpload(upload);
    setUploadedState(upload);
  }

  /** Delete the uploaded file from the Dappnode, to choose another one or to leave */
  async function onRemoveUpload() {
    const upload = uploaded;
    setUploaded(null);
    setInspected(null);
    setFile(null);
    setError(null);
    if (upload) await api.fullBackupUploadDiscard({ fileId: upload.fileId }).catch((e) => setError(e));
  }

  if (job) {
    return (
      <>
        <RestoreProgress status={job} />
        {!running && (
          <Button
            onClick={() => {
              setDismissed(job.startedAt ?? "");
              setStarted(false);
              void onRemoveUpload();
            }}
          >
            Restore another backup
          </Button>
        )}
      </>
    );
  }

  async function onRead() {
    if (!password || (!file && !uploaded)) return;
    try {
      setError(null);
      setReading(true);
      // Upload once: a wrong password is retried on the uploaded file
      let upload = uploaded;
      if (!upload && file) {
        setUploadProgress(0);
        const { fileId } = await apiRoutes.uploadFile(file, ({ loaded, total }) =>
          setUploadProgress(Math.round((100 * loaded) / total))
        );
        setUploadProgress(null);
        upload = { fileId, name: file.name, size: file.size, uploadedAt: Date.now() };
        setUploaded(upload);
      }
      if (!upload) return;
      const result = await apiRoutes.inspectFullBackup({ fileId: upload.fileId, password });
      setInspected({ result, fileId: upload.fileId });
    } catch (e) {
      if (/Uploaded backup not found/.test(e.message)) {
        setUploaded(null);
        setError(Error("The uploaded backup was deleted from the Dappnode after 30 minutes. Choose the file again."));
      } else {
        setError(e);
      }
    } finally {
      setReading(false);
      setUploadProgress(null);
    }
  }

  if (inspected) {
    return (
      <>
        <RestorePlan
          inspected={inspected.result}
          fileId={inspected.fileId}
          password={password}
          onStarted={() => {
            // The Dappnode deleted the upload once it extracted it
            setUploaded(null);
            setStarted(true);
            statusRes.revalidate();
          }}
        />
        <Button onClick={onRemoveUpload}>Remove upload and choose another file</Button>
      </>
    );
  }

  return (
    <>
      {status && status.status !== "idle" && (
        <div className="full-backup-note">
          Last restore {status.status === "done" ? "finished" : "failed"}
          {status.finishedAt ? ` on ${new Date(status.finishedAt).toLocaleString()}` : ""}.
        </div>
      )}
      <p>Restore a .dnbackup file. Nothing changes until you review what the restore will do and confirm it.</p>
      {uploaded ? (
        <div className="full-backup-upload">
          <div>
            Backup file: <b>{uploaded.name}</b> ({prettyBytes(uploaded.size)}), uploaded to your Dappnode
            <div className="full-backup-note">
              It is kept there for 30 minutes, so you can retry the password without uploading it again.
            </div>
          </div>
          <Button onClick={onRemoveUpload}>Remove upload</Button>
        </div>
      ) : (
        <Form.Group controlId="full-backup-restore-file">
          <Form.Label>Backup file</Form.Label>
          <Form.Control
            type="file"
            accept=".dnbackup"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
          />
        </Form.Group>
      )}
      <InputForm
        fields={[
          {
            label: "Backup password",
            labelId: "full-backup-restore-password",
            name: "backup-password",
            autoComplete: "off",
            secret: true,
            value: password,
            onValueChange: setPassword
          }
        ]}
      >
        <Button
          type="submit"
          variant="dappnode"
          onClick={onRead}
          disabled={(!file && !uploaded) || !password || reading}
        >
          {reading ? "Reading backup..." : "Read backup"}
        </Button>
      </InputForm>
      {uploadProgress !== null && <ProgressBar now={uploadProgress} label={`Uploading ${uploadProgress}%`} />}
      {error && <ErrorView error={error} hideIcon red />}
    </>
  );
}
