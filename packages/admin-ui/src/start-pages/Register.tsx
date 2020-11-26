import React, { useState } from "react";
import { BsShieldLock } from "react-icons/bs";
import { InputSecret } from "components/InputSecret";
import Button from "components/Button";
import { fetchRegister } from "../api/auth";
import { StandaloneContainer } from "./StandaloneContainer";
import "./register.scss";
import Alert from "react-bootstrap/Alert";
import { ReqStatus } from "types";

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

  async function onCopiedRecoveryToken() {
    await refetchStatus()?.catch(() => {});
    setRecoveryToken(undefined);
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
        >
          Register
        </Button>
      </div>

      <div>
        {reqStatus.result
          ? JSON.stringify(reqStatus.result)
          : reqStatus.error
          ? `Error ${reqStatus.error.message}`
          : reqStatus.loading
          ? "Loading..."
          : null}
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
