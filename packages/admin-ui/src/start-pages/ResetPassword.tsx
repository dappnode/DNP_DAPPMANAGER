import React, { useState } from "react";
import { BsLock } from "react-icons/bs";
import { InputSecret } from "components/InputSecret";
import Button from "components/Button";
import { fetchRecoverPass } from "../api/auth";
import { StandaloneContainer } from "./StandaloneContainer";
import { ReqStatus } from "types";
import ErrorView from "components/ErrorView";
import Alert from "react-bootstrap/esm/Alert";

export function ResetPassword({
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
