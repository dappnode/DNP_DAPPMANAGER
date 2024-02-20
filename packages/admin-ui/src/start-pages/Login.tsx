import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BsLock } from "react-icons/bs";
import { apiAuth } from "api";
import Button from "components/Button";
import { InputForm } from "components/InputForm";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { StandaloneContainer } from "./StandaloneContainer";
import { ReqStatus } from "types";
import { ResetPassword } from "./ResetPassword";
import "./login.scss";

const loginRootPath = "/";
const forgotPasswordPath = "/forgot-password";

export function Login({
  refetchStatus
}: {
  refetchStatus: () => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  const location = useLocation();
  const navigate = useNavigate();

  async function onLogin() {
    try {
      setReqStatus({ loading: true });
      await apiAuth.login({ username, password });
      setReqStatus({ result: true });

      // Make sure user is properly logged in
      const status = await apiAuth.fetchLoginStatus();
      switch (status.status) {
        case "logged-in":
          break; // OK
        case "not-logged-in":
          if (status.noCookie) {
            setReqStatus({ error: "Error logging in, cookies not enabled" });
          } else {
            setReqStatus({ error: "Error logging in, unknown error" });
          }
          break;
      }
    } catch (e) {
      setReqStatus({ error: e });
    } finally {
      refetchStatus();
    }
  }

  function onForgotPassword() {
    navigate(forgotPasswordPath);
  }

  async function onSuccessfulReset() {
    await refetchStatus()?.catch(() => { });
    navigate(loginRootPath);
  }

  // Use minimal router since there only one possible path
  if (location.pathname === forgotPasswordPath) {
    return <ResetPassword onSuccessfulReset={onSuccessfulReset} />;
  }

  return (
    <StandaloneContainer TopIcon={BsLock} title="Login">
      <InputForm
        fields={[
          {
            label: "Username",
            labelId: "username",
            name: "username",
            autoComplete: "username",
            autoFocus: true,
            value: username,
            onValueChange: setUsername
          },
          {
            label: "Password",
            labelId: "password",
            name: "current-password",
            autoComplete: "current-password",
            secret: true,
            value: password,
            onValueChange: setPassword
          }
        ]}
      >
        <Button
          type="submit"
          className="register-button"
          onClick={onLogin}
          variant="dappnode"
          disabled={reqStatus.loading || !password}
          fullwidth
        >
          Login
        </Button>
      </InputForm>

      <div className="forgot-password-text" onClick={onForgotPassword}>
        Forgot password?
      </div>

      {reqStatus.result && <Ok ok msg="Logged in"></Ok>}
      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
    </StandaloneContainer>
  );
}
