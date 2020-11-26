import React, { useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { BsLock } from "react-icons/bs";
import { InputSecret } from "components/InputSecret";
import Button from "components/Button";
import { fetchLogin, fetchRecoverPass } from "../api/auth";
import { StandaloneContainer } from "./StandaloneContainer";
import "./login.scss";
import { ReqStatus } from "types";
import ErrorView from "components/ErrorView";
import Alert from "react-bootstrap/esm/Alert";
import Ok from "components/Ok";

const loginRootPath = "/";
const forgotPasswordPath = "/forgot-password";

export function Login({
  refetchStatus
}: {
  refetchStatus: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus<string>>({});

  const location = useLocation();
  const history = useHistory();

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

  function onForgotPassword() {
    history.push(forgotPasswordPath);
  }

  async function onSuccessfulReset() {
    await refetchStatus()?.catch(() => {});
    history.push(loginRootPath);
  }

  // Use minimal router since there only one possible path
  if (location.pathname === forgotPasswordPath) {
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
          disabled={reqStatus.loading || !password}
        >
          Login
        </Button>
      </div>

      <div className="forgot-password-text" onClick={onForgotPassword}>
        Forgot password?
      </div>

      <div>
        {reqStatus.result && (
          <Ok ok msg={`Logged in! Session ${reqStatus.result}`}></Ok>
        )}
        {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
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

      <Alert variant="warning">
        If you have lost your recovery token you have to directly access your
        machine via SSH or by connecting a keyboard and screen and follow this
        guide
        <br />
        <a href="#">Reset your DAppNode admin password TODO</a>
      </Alert>

      <div className="password-form">
        <div className="text">Recovery token</div>
        <InputSecret value={token} onValueChange={setToken} />

        <Button
          className="register-button"
          onClick={onReset}
          variant="dappnode"
          disabled={reqStatus.loading || !token}
        >
          Reset password
        </Button>
      </div>

      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
    </StandaloneContainer>
  );
}
