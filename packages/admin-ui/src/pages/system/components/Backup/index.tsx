import React, { useState } from "react";
import Alert from "react-bootstrap/esm/Alert";
import Form from "react-bootstrap/esm/Form";
import { apiRoutes, useApi } from "api";
import { FullBackupCreateResult, FullBackupInfo, FullBackupPackageInfo } from "@dappnode/types";
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

function CreateBackupForm({ info }: { info: FullBackupInfo }) {
  const [adminPassword, setAdminPassword] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [keepValidatorsStopped, setKeepValidatorsStopped] = useState(false);
  const [reqStatus, setReqStatus] = useState<ReqStatus<FullBackupCreateResult>>({});
  const validators = info.packages.filter((pkg) => pkg.validator);

  const lengthError =
    password.length < info.passwordMinLength
      ? `The backup password must be at least ${info.passwordMinLength} characters long`
      : null;
  const matchError = validatePasswordsMatch(password, password2);
  const isValid = adminPassword && password && password2 === password && !lengthError && !matchError;
  const hint = password && !lengthError ? passwordStrengthHint(password) : null;

  async function onCreate() {
    if (!isValid) return;
    try {
      setReqStatus({ loading: true });
      const result = await apiRoutes.createFullBackup({ adminPassword, password, keepValidatorsStopped });
      setReqStatus({ result });
      setAdminPassword("");
      setPassword("");
      setPassword2("");
      window.open(apiRoutes.downloadUrl({ fileId: result.fileId }), "_newtab");
    } catch (e) {
      const message = e.message === "WRONG_CREDENTIALS" ? "Wrong admin password" : e.message;
      setReqStatus({ error: Error(message) });
    }
  }

  if (reqStatus.result) {
    const { fileId, fileName, sizeBytes, warnings, stoppedValidators } = reqStatus.result;
    return (
      <div className="full-backup-result">
        <Alert variant="success">
          Backup ready: {fileName} ({prettyBytes(sizeBytes)}). The download starts automatically.
        </Alert>
        <a href={apiRoutes.downloadUrl({ fileId })} {...newTabProps} className="no-a-style">
          <Button variant="dappnode">Download backup</Button>
        </a>
        <div className="full-backup-note">
          Allow browser pop-ups or click download. The download link works once and expires in 30 minutes.
        </div>
        {stoppedValidators.length > 0 && (
          <Alert variant="warning">
            These validators are stopped and stay stopped, so this backup holds their exact slashing protection:{" "}
            {stoppedValidators.map(prettyDnpName).join(", ")}. Do not start them on this node again if you restore the
            backup elsewhere.
          </Alert>
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
      </div>
    );
  }

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
          <Form.Check
            type="checkbox"
            id="full-backup-keep-validators-stopped"
            className="full-backup-keep-stopped"
            checked={keepValidatorsStopped}
            onChange={(e) => setKeepValidatorsStopped(e.target.checked)}
            label={`I am moving or reinstalling this Dappnode: keep validators stopped after the backup (${validators
              .map((pkg) => prettyDnpName(pkg.dnpName))
              .join(
                ", "
              )}). Validators are always paused while their data is copied, so their slashing protection is exact; leaving them stopped guarantees nothing is signed after it.`}
          />
        )}
        <Button type="submit" onClick={onCreate} variant="dappnode" disabled={!isValid || reqStatus.loading}>
          {reqStatus.loading ? "Creating backup..." : "Create backup"}
        </Button>
      </InputForm>
      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
    </>
  );
}

export function FullBackup() {
  const infoRes = useApi.fullBackupInfo();

  return (
    <>
      <SubTitle>Full backup</SubTitle>
      <Card spacing>
        {renderResponse(infoRes, ["Checking installed packages"], (info) => (
          <>
            <CoverageSummary packages={info.packages} />
            <CreateBackupForm info={info} />
          </>
        ))}
      </Card>
    </>
  );
}
