import React, { useState, useEffect } from "react";
import { BsShieldLock } from "react-icons/bs";
import Alert from "react-bootstrap/Alert";
import { fetchRegister } from "api/auth";
import { apiUrls } from "params";
import { StandaloneContainer } from "./StandaloneContainer";
import { ReqStatus } from "types";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import { InputForm } from "components/InputForm";
import {
  validatePasswordsMatch,
  validateStrongPassword
} from "utils/validation";
import "./register.scss";
import Ok from "components/Ok";

export function Register({
  refetchStatus
}: {
  refetchStatus: () => Promise<void>;
}) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [recoveryToken, setRecoveryToken] = useState<string>();
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  const passwordError = validateStrongPassword(password);
  const password2Error = validatePasswordsMatch(password, password2);
  const isValid = password && password2 && !passwordError && !password2Error;

  async function onRegister() {
    if (isValid)
      try {
        setReqStatus({ loading: true });
        const res = await fetchRegister({ username, password });
        setRecoveryToken(res.recoveryToken);
        setReqStatus({ result: true });
      } catch (e) {
        setReqStatus({ error: e });
      }
  }

  function onCopiedRecoveryToken() {
    refetchStatus()?.catch(() => {});
  }

  useEffect(() => {
    async function fetchServerName() {
      const res = await fetch(apiUrls.globalEnvsServerName);
      const serverName = await res.text();
      if (res.ok && serverName) setUsername(serverName);
    }
    fetchServerName().catch(e => {
      console.warn(`Error fetching serverName: ${e.message}`);
    });
  }, []);

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

      <InputForm
        fields={[
          {
            label: "Username",
            labelId: "username",
            value: username,
            onValueChange: setUsername
          },
          {
            label: "New password",
            labelId: "new-password",
            secret: true,
            value: password,
            onValueChange: setPassword,
            error: passwordError
          },
          {
            label: "Confirm new password",
            labelId: "confirm-new-password",
            secret: true,
            value: password2,
            onValueChange: setPassword2,
            error: password2Error
          }
        ]}
      />

      <Button
        onClick={onRegister}
        variant="dappnode"
        disabled={reqStatus.loading || !isValid}
        fullwidth
      >
        Register
      </Button>

      {reqStatus.result && <Ok ok msg="Registered"></Ok>}
      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
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

      <Button
        className="register-button"
        onClick={onCopiedRecoveryToken}
        variant="dappnode"
      >
        I've copied the recovery token
      </Button>
    </StandaloneContainer>
  );
}
