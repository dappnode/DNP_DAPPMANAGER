import React, { useState } from "react";
import { BsShieldLock } from "react-icons/bs";
import { InputSecret } from "components/InputSecret";
import Button from "components/Button";
import { fetchRegister } from "../api/auth";
import { StandaloneContainer } from "./StandaloneContainer";
import Alert from "react-bootstrap/Alert";
import { ReqStatus } from "types";
import ErrorView from "components/ErrorView";
import "./register.scss";

export function Register({
  refetchStatus
}: {
  refetchStatus: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [recoveryToken, setRecoveryToken] = useState<string>();
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  async function onRegister() {
    try {
      setReqStatus({ loading: true });
      const res = await fetchRegister({ password });
      setRecoveryToken(res.recoveryToken);
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  function onCopiedRecoveryToken() {
    refetchStatus()?.catch(() => {});
  }

  if (recoveryToken) {
    // Second phase of registration, user must copy the recovery token
    return (
      <CopyRecoveryToken
        recoveryToken={recoveryToken}
        onCopiedRecoveryToken={onCopiedRecoveryToken}
      ></CopyRecoveryToken>
    );
  }

  const passwordError = validatePassword({ password, password2 });

  // First phase of registration, user provides password
  return (
    <StandaloneContainer TopIcon={BsShieldLock} title="Register">
      <div className="text">
        Welcome! To protect your DAppNode register an admin password. It is
        recommended to use a password manager to set a very strong password
      </div>

      <div className="password-form">
        <div className="text">Password</div>
        <InputSecret value={password} onValueChange={setPassword} />
        <div className="text">Confirm password</div>
        <InputSecret value={password2} onValueChange={setPassword2} />

        <Button
          className="register-button"
          onClick={onRegister}
          variant="dappnode"
          disabled={
            reqStatus.loading ||
            !password ||
            !password2 ||
            Boolean(passwordError)
          }
        >
          Register
        </Button>
      </div>

      <div>
        {passwordError && <ErrorView error={passwordError} hideIcon red />}
        {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
      </div>
    </StandaloneContainer>
  );
}

function CopyRecoveryToken({
  recoveryToken,
  onCopiedRecoveryToken
}: {
  recoveryToken: string;
  onCopiedRecoveryToken: () => void;
}) {
  return (
    <StandaloneContainer TopIcon={BsShieldLock} title="Recovery token">
      <div className="text">
        Store the recovery token in a safe place. If you lose your password it
        will allow you to reset the admin account and register again
      </div>

      <div className="recovery-token-box">{recoveryToken}</div>

      <Alert variant="warning">
        Warning! If you also lose your recovery token you will have to directly
        access your machine
      </Alert>

      <div>
        <Button
          className="register-button"
          onClick={onCopiedRecoveryToken}
          variant="dappnode"
        >
          I've copied the recovery token
        </Button>
      </div>
    </StandaloneContainer>
  );
}

function validatePassword({
  password,
  password2
}: {
  password: string;
  password2: string;
}): string | null {
  if (!password) return null;

  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/\d+/.test(password)) return "Password must contain at least one number";
  if (!/[A-Z]+/.test(password))
    return "Password must contain at least one capital letter";
  if (password2 && password !== password2) return "Passwords do not match";

  return null;
}
