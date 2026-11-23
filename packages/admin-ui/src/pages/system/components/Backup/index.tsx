import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getCoreUpdateAvailable } from "services/coreUpdate/selectors";
import { confirm } from "components/ConfirmDialog";
import Alert from "react-bootstrap/esm/Alert";
import ProgressBar from "react-bootstrap/esm/ProgressBar";
import { apiRoutes, useApi } from "api";
import { FullBackupCreateResult, FullBackupInfo, FullBackupPackageInfo, FullBackupProgress } from "@dappnode/types";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import { InputForm } from "components/InputForm";
import { renderResponse } from "components/SwrRender";
import { prettyBytes, prettyDnpName } from "utils/format";
import { validatePasswordsMatch } from "utils/validation";
import newTabProps from "utils/newTabProps";
import { ReqStatus } from "types";
import { FullBackupRestore } from "./Restore";
import "./backup.scss";

/**
 * Non-blocking strength hint. The only hard rule is the minimum length:
 * the file is protected with a slow key derivation (scrypt)
 */
export function passwordStrengthHint(password: string): { level: "weak" | "fair" | "strong"; text: string } {
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 16 || (password.length >= 12 && classes >= 3)) {
    return { level: "strong", text: "Strong password" };
  }
  if (password.length >= 12 || classes >= 3) {
    return { level: "fair", text: "Fair password. A longer passphrase is stronger." };
  }
  return { level: "weak", text: "Weak password. Consider a longer passphrase of several words." };
}

function CoverageSummary({ packages }: { packages: FullBackupPackageInfo[] }) {
  const notCovered = packages.filter((pkg) => pkg.coverage === "not-covered");
  const covered = packages.filter((pkg) => pkg.coverage === "covered");

  return (
    <>
      <p>
        The backup contains your Dappnode settings, its dyndns identity, your admin login, and the configuration of all{" "}
        {packages.length} installed packages. For {covered.length} packages it also includes the data they mark as
        important, such as keys and wallets. Volumes such as blockchain data are not included: they can be synced again.
      </p>
      {notCovered.length > 0 && (
        <Alert variant="warning" className="full-backup-not-covered">
          <div>
            These packages store data but do not declare which files are important, so{" "}
            <b>their data is not in the backup</b>. Only their configuration is saved:
          </div>
          <ul>
            {notCovered.map((pkg) => (
              <li key={pkg.dnpName}>
                {prettyDnpName(pkg.dnpName)}{" "}
                <span className="full-backup-volumes">({pkg.namedVolumes.join(", ")})</span>
              </li>
            ))}
          </ul>
          <div>If one of these packages holds data you cannot recreate, back it up separately before reinstalling.</div>
        </Alert>
      )}
    </>
  );
}

function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes} min ${seconds % 60} s` : `${seconds} s`;
}

/** Live progress of the backup being created, from fullBackupStatus */
function BackupProgress({ progress }: { progress?: FullBackupProgress }) {
  if (!progress) {
    return (
      <div className="full-backup-create-progress">
        <div>Starting the backup...</div>
        <ProgressBar now={100} animated striped />
      </div>
    );
  }

  const { step, dnpName, packagesDone, packagesTotal, copiedBytes, archivedBytes, archiveTotalBytes } = progress;
  const name = dnpName ? prettyDnpName(dnpName) : "";
  const packageCount = `${Math.min(packagesDone + 1, packagesTotal)} of ${packagesTotal}`;
  let title: string;
  let detail: string | null = null;
  let percent: number;
  if (step === "archiving") {
    percent = archiveTotalBytes > 0 ? (100 * archivedBytes) / archiveTotalBytes : 100;
    title = "Step 2 of 2: compressing and encrypting the backup file";
    detail = `${prettyBytes(archivedBytes)} of ${prettyBytes(archiveTotalBytes)}`;
  } else {
    percent = packagesTotal > 0 ? (100 * packagesDone) / packagesTotal : 0;
    title = "Step 1 of 2: copying package data";
    if (step === "preparing") detail = "Saving the Dappnode's settings";
    else if (step === "stopping") detail = `Stopping ${name} (${packageCount}) so its slashing protection is exact`;
    else if (step === "restarting") detail = `Starting ${name} again (${packageCount})`;
    else detail = `${name} (${packageCount})`;
    detail += ` · ${prettyBytes(copiedBytes)} copied`;
  }

  return (
    <div className="full-backup-create-progress">
      <div>{title}</div>
      <ProgressBar now={percent} label={`${Math.floor(percent)}%`} animated striped />
      <div className="full-backup-note">
        {detail} · running for {formatElapsed(Date.now() - Date.parse(progress.startedAt))}
      </div>
    </div>
  );
}

const systemUpdatePath = "/system/update";

/**
 * Backups made on the latest version restore with the fewest migrations:
 * the restoring node installs this version or newer
 */
function UpdateFirstNotice({ coreUpdateAvailable }: { coreUpdateAvailable: boolean }) {
  const navigate = useNavigate();
  if (!coreUpdateAvailable) {
    return (
      <div className="full-backup-note">
        Your Dappnode is up to date. Keeping it updated before each backup makes restoring smoother.
      </div>
    );
  }
  return (
    <Alert variant="warning" className="full-backup-update-first">
      <div>
        <b>A Dappnode update is available.</b> Update before creating a backup: a backup made on the latest version
        restores with fewer surprises, and a node can only restore backups from its own version or older.
      </div>
      <Button variant="dappnode" onClick={() => navigate(systemUpdatePath)}>
        Go to update
      </Button>
    </Alert>
  );
}

function CreateBackupForm({ info, coreUpdateAvailable }: { info: FullBackupInfo; coreUpdateAvailable: boolean }) {
  const navigate = useNavigate();
  const [adminPassword, setAdminPassword] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus<FullBackupCreateResult>>({});
  const validators = info.packages.filter((pkg) => pkg.validator);

  // The backup goes on in the Dappnode if its request is dropped, and its
  // result is kept there: show it instead of losing it
  const statusRes = useApi.fullBackupStatus();
  const revalidateStatus = statusRes.revalidate;
  const runningElsewhere = Boolean(statusRes.data?.inProgress) && !reqStatus.loading;
  const creating = Boolean(reqStatus.loading) || runningElsewhere;
  /** `finishedAt` of an earlier backup, not to be shown again */
  const [dismissed, setDismissed] = useState<string>();
  const last = statusRes.data?.last?.finishedAt === dismissed ? undefined : statusRes.data?.last;

  // Follow the progress of a backup, created from this page or elsewhere
  useEffect(() => {
    if (!creating) return;
    const interval = setInterval(() => revalidateStatus(), 1000);
    return () => clearInterval(interval);
  }, [creating, revalidateStatus]);

  const lengthError =
    password.length < info.passwordMinLength
      ? `The backup password must be at least ${info.passwordMinLength} characters long`
      : null;
  const matchError = validatePasswordsMatch(password, password2);
  const isValid = adminPassword && password && password2 === password && !lengthError && !matchError;
  const hint = password && !lengthError ? passwordStrengthHint(password) : null;

  const validatorNames = validators.map((pkg) => prettyDnpName(pkg.dnpName)).join(", ");

  function onCreate() {
    if (!isValid) return;
    if (!coreUpdateAvailable) {
      askAboutValidators();
      return;
    }
    confirm({
      title: "Update Dappnode first?",
      text: "A Dappnode update is available. Backups made on the latest version restore with fewer surprises, and the node you restore on must run this version or newer. We recommend updating first and then creating the backup.",
      buttons: [
        // The dialog closes after this handler: open the next one after it
        { label: "Back up anyway", variant: "outline-secondary", onClick: () => setTimeout(askAboutValidators) },
        { label: "Update first", variant: "dappnode", onClick: () => navigate(systemUpdatePath) }
      ]
    });
  }

  function askAboutValidators() {
    if (validators.length === 0) return void create({});
    // Whether validators are interrupted, and whether the backup can safely
    // be restored elsewhere, depends on this: ask explicitly, every time
    confirm({
      title: "Validators on this Dappnode",
      text: `Their keys and slashing protection must be copied with the validators stopped, so the backup holds exactly what they last signed. What should happen to **${validatorNames}**?`,
      list: [
        {
          title: "Pause, copy, and keep validating here",
          body: "Each one stops while its data is copied, usually a minute or two (it may miss a few attestations), then starts again. Never run this backup's validators on another node while this one is on: the same keys on two nodes get slashed."
        },
        {
          title: "Leave validators out of the backup",
          body: "They keep validating without any pause. The backup has their settings but not their keys or slashing protection: after a restore, import the keys again with their slashing protection."
        },
        {
          title: "I am moving or reinstalling this Dappnode",
          body: "They stop for the copy and stay stopped, so nothing is signed after the backup. Restore it on the new node and start them there. If you change your mind, start them again from their package page."
        }
      ],
      buttons: [
        { label: "Pause and copy", variant: "dappnode", onClick: () => void create({}) },
        {
          label: "Leave them out",
          variant: "outline-dappnode",
          onClick: () => void create({ skipValidatorData: true })
        },
        { label: "Stop, I'm moving", variant: "danger", onClick: () => void create({ keepValidatorsStopped: true }) }
      ]
    });
  }

  async function create({
    keepValidatorsStopped = false,
    skipValidatorData = false
  }: {
    keepValidatorsStopped?: boolean;
    skipValidatorData?: boolean;
  }) {
    try {
      setDismissed(statusRes.data?.last?.finishedAt);
      setReqStatus({ loading: true });
      const result = await apiRoutes.createFullBackup({
        adminPassword,
        password,
        keepValidatorsStopped,
        skipValidatorData
      });
      setReqStatus({ result });
      setAdminPassword("");
      setPassword("");
      setPassword2("");
      window.open(apiRoutes.downloadUrl({ fileId: result.fileId }), "_newtab");
    } catch (e) {
      const message = e.message === "WRONG_CREDENTIALS" ? "Wrong admin password" : e.message;
      setReqStatus({ error: Error(message) });
    } finally {
      revalidateStatus();
    }
  }

  function onCreateAnother() {
    setDismissed(statusRes.data?.last?.finishedAt);
    setReqStatus({});
  }

  const result = reqStatus.result ?? last?.result;
  if (result) {
    const { fileId, fileName, sizeBytes, warnings, stoppedValidators, skippedValidators = [] } = result;
    return (
      <div className="full-backup-result">
        <Alert variant="success">
          Backup ready: {fileName} ({prettyBytes(sizeBytes)}).
          {reqStatus.result && " The download starts automatically."}
        </Alert>
        <a href={apiRoutes.downloadUrl({ fileId })} {...newTabProps} className="no-a-style">
          <Button variant="dappnode">Download backup</Button>
        </a>
        <div className="full-backup-note">
          Allow browser pop-ups or click download. The download link works once and expires in 30 minutes.
        </div>
        {stoppedValidators.length > 0 ? (
          <Alert variant="danger" className="full-backup-validators">
            <b>Validators stopped: {stoppedValidators.map(prettyDnpName).join(", ")}.</b> They stay stopped, so this
            backup holds their exact slashing protection. Start them on the node you restore the backup on, not here.
          </Alert>
        ) : skippedValidators.length > 0 ? (
          <Alert variant="warning" className="full-backup-validators">
            <b>Validators not in this backup: {skippedValidators.map(prettyDnpName).join(", ")}.</b> They kept
            validating. The backup has their settings only: keep their keystores and slashing protection backed up
            separately.
          </Alert>
        ) : (
          validators.length > 0 && (
            <Alert variant="warning" className="full-backup-validators">
              <b>Validators still running here: {validatorNames}.</b> Never run this backup&apos;s validators on another
              node while this one is on: the same keys on two nodes get slashed.
            </Alert>
          )
        )}
        {warnings.length > 0 && (
          <Alert variant="warning">
            <div>Some items could not be backed up:</div>
            <ul>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}
        <Alert variant="info">
          Store the file and its password separately. Without the password the backup cannot be opened, and it cannot be
          recovered.
        </Alert>
        <Button onClick={onCreateAnother}>Create another backup</Button>
      </div>
    );
  }

  // A dropped request leaves a network error here: the Dappnode knows how the backup really ended
  const error = last?.error ? Error(`The backup failed: ${last.error}`) : reqStatus.error;

  return (
    <>
      <InputForm
        fields={[
          {
            label: "Admin password (to confirm it's you)",
            labelId: "full-backup-admin-password",
            name: "current-password",
            autoComplete: "current-password",
            secret: true,
            value: adminPassword,
            onValueChange: setAdminPassword
          },
          {
            label: "Backup password",
            labelId: "full-backup-password",
            name: "backup-password",
            autoComplete: "new-password",
            secret: true,
            value: password,
            onValueChange: setPassword,
            error: lengthError
          },
          {
            label: "Confirm backup password",
            labelId: "full-backup-password-confirm",
            name: "backup-password-confirm",
            autoComplete: "new-password",
            secret: true,
            value: password2,
            onValueChange: setPassword2,
            error: matchError
          }
        ]}
        childrenBefore={
          <p className="full-backup-note">
            The backup is encrypted with this password. Choose a new one, not your admin password. If you lose it, the
            backup cannot be opened.
          </p>
        }
      >
        {hint && <div className={`full-backup-strength full-backup-strength-${hint.level}`}>{hint.text}</div>}
        {validators.length > 0 && (
          <Alert variant="warning" className="full-backup-validators">
            <b>Validators: {validatorNames}.</b> When you create the backup, you choose whether to pause them to include
            their keys and slashing protection, or to leave them out so they keep validating.
          </Alert>
        )}
        <Button type="submit" onClick={onCreate} variant="dappnode" disabled={!isValid || creating}>
          {creating ? "Creating backup..." : "Create backup"}
        </Button>
      </InputForm>
      {creating && <BackupProgress progress={statusRes.data?.progress} />}
      {runningElsewhere && (
        <Alert variant="info" className="full-backup-running">
          A backup is being created. Its result will show here when it finishes.
        </Alert>
      )}
      {!creating && error && <ErrorView error={error} hideIcon red />}
    </>
  );
}

export function FullBackup() {
  const infoRes = useApi.fullBackupInfo();
  const coreUpdateAvailable = useSelector(getCoreUpdateAvailable);

  return (
    <>
      <SubTitle>Full backup</SubTitle>
      <Card spacing>
        {renderResponse(infoRes, ["Checking installed packages"], (info) => (
          <>
            <UpdateFirstNotice coreUpdateAvailable={coreUpdateAvailable} />
            <CoverageSummary packages={info.packages} />
            <CreateBackupForm info={info} coreUpdateAvailable={coreUpdateAvailable} />
          </>
        ))}
      </Card>

      <SubTitle>Restore</SubTitle>
      <Card spacing>
        <FullBackupRestore />
      </Card>
    </>
  );
}
