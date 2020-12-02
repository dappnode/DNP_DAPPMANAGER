import React, { useState } from "react";
import { BsShieldLock } from "react-icons/bs";
import Alert from "react-bootstrap/Alert";
import { fetchRegister } from "api/auth";
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
import Input from "components/Input";

export function Register({
  refetchStatus
}: {
  refetchStatus: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [recoveryToken, setRecoveryToken] = useState<string>();
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  // Virtual username for password managers
  // TODO: Use DAppnode's name
  const username = "admin";
  const passwordError = validateStrongPassword(password);
  const password2Error = validatePasswordsMatch(password, password2);
  const isValid = password && password2 && !passwordError && !password2Error;

  async function onRegister() {
    if (isValid)
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
            title: "New password",
            secret: true,
            value: password,
            onValueChange: setPassword,
            error: passwordError
          },
          {
            title: "Confirm new password",
            secret: true,
            value: password2,
            onValueChange: setPassword2,
            error: password2Error
          }
        ]}
        // Add an input that is there but not visible for password managers
        // With this input the password will be registered with a valid username
        // which makes better UX :)
        childrenBefore={
          <div className="hidden-input">
            <Input value={username} onValueChange={() => {}}></Input>
          </div>
        }
      />

      <Button
        onClick={onRegister}
        variant="dappnode"
        disabled={reqStatus.loading || !isValid}
        fullwidth
      >
        Register
      </Button>

      {reqStatus.result && <Ok ok msg={"Registered"}></Ok>}
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
