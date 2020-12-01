import React, { useState } from "react";
import Button from "components/Button";
import { validatePassword } from "start-pages/Register";
import ErrorView from "components/ErrorView";
import { InputSecret } from "components/InputSecret";
import { fetchChangePass } from "api/auth";
import { ReqStatus } from "types";
import Ok from "components/Ok";

export function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  async function onChangePassword() {
    try {
      setReqStatus({ loading: true });
      await fetchChangePass({
        password: oldPassword,
        newPassword
      });
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  const passwordError = validatePassword({
    password: newPassword,
    password2: newPassword2
  });

  return (
    <>
      <div className="password-form">
        <div className="text">Current password</div>
        <InputSecret value={oldPassword} onValueChange={setOldPassword} />
        <div className="text">New password</div>
        <InputSecret value={newPassword} onValueChange={setNewPassword} />
        <div className="text">Confirm new password</div>
        <InputSecret value={newPassword2} onValueChange={setNewPassword2} />

        <Button
          className="register-button"
          onClick={onChangePassword}
          variant="dappnode"
          disabled={
            reqStatus.loading ||
            !newPassword ||
            !newPassword2 ||
            Boolean(passwordError)
          }
        >
          Change password
        </Button>
      </div>

      <div>
        {reqStatus.result && <Ok ok msg={"Changed password"}></Ok>}
        {passwordError && <ErrorView error={passwordError} hideIcon red />}
        {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
      </div>
    </>
  );
}
