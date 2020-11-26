import React, { useState } from "react";
import { BsLock } from "react-icons/bs";
import { InputSecret } from "components/InputSecret";
import Button from "components/Button";
import { fetchLogin, fetchRecoverPass } from "../api/auth";
import { StandaloneContainer } from "./StandaloneContainer";
import "./login.scss";
import { ReqStatus } from "types";
import ErrorView from "components/ErrorView";

export function Login({
  refetchStatus
}: {
  refetchStatus: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus<string>>({});
  const [forgotPassword, setForgotPassword] = useState(false);

  async function onLogin() {
    try {
      setReqStatus({ loading: true });
      const { sessionId } = await fetchLogin({ password });
      setReqStatus({ result: sessionId });
    } catch (e) {
      setReqStatus({ error: e });
    } finally {
      refetchStatus();
    }
  }

  async function onSuccessfulReset() {
    await refetchStatus()?.catch(() => {});
    setForgotPassword(false);
  }

  if (forgotPassword) {
    return <ResetPassword onSuccessfulReset={onSuccessfulReset} />;
  }

  return (
    <StandaloneContainer TopIcon={BsLock} title="Login">
      <div className="password-form">
        <div className="text">Password</div>
        <InputSecret value={password} onValueChange={setPassword} />

        <Button
          className="register-button"
          onClick={onLogin}
          variant="dappnode"
        >
          Login
        </Button>
      </div>

      <div
        className="forgot-password-text"
        onClick={() => setForgotPassword(true)}
      >
        Forgot password?
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

function ResetPassword({
  onSuccessfulReset
}: {
  onSuccessfulReset: () => void;
}) {
  const [token, setToken] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  async function onReset() {
    try {
      setReqStatus({ loading: true });
      await fetchRecoverPass({ token });
      setReqStatus({ result: true });
      onSuccessfulReset();
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  return (
    <StandaloneContainer TopIcon={BsLock} title="Reset">
      <div className="text">
        Use your recovery token to reset the admin password and register again
      </div>

      <div className="password-form">
        <div className="text">Recovery token</div>
        <InputSecret value={token} onValueChange={setToken} />

        <Button
          className="register-button"
          onClick={onReset}
          variant="dappnode"
          disabled={!token || reqStatus.loading}
        >
          Reset password
        </Button>
      </div>

      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
    </StandaloneContainer>
  );
}
