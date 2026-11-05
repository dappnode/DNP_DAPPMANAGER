import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { validatePasswordsMatch, validateStrongPasswordAsDockerEnv } from "utils/validation";
import { useApi } from "api";

import * as a from "pages/system/actions";

import Card from "components/Card";
import { InputForm } from "components/InputForm";
import Button from "components/Button";

import "./changeHostUserPassword.scss";

export default function ChangeHostUserPassword() {
  const dispatch = useDispatch();
  const passwordIsSecureReq = useApi.passwordIsSecure();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const passwordError = validateStrongPasswordAsDockerEnv(password);
  const password2Error = validatePasswordsMatch(password, password2);
  const isValid = password && password2 && !passwordError && !password2Error;

  function onChangePassword() {
    if (isValid) dispatch(a.passwordChange(password));
  }

  const showInsecureWarning = passwordIsSecureReq.data === false;

  return (
    <Card spacing className="change-host-user-password">
      {showInsecureWarning ? (
        <Card spacing shadow className="warning">
          <div className="title">Action recommended</div>
          <div>
            Your host user password is still the factory default and is insecure. Change it to a strong password to
            protect your DAppNode.
          </div>
        </Card>
      ) : null}

      <div className="description">
        Change the host user password. You will never be able to see this password again, so make sure to store it
        safely.
      </div>

      <InputForm
        fields={[
          {
            label: "New password",
            labelId: "new-password",
            name: "new-host-password",
            autoComplete: "new-password",
            secret: true,
            value: password,
            onValueChange: setPassword,
            error: passwordError
          },
          {
            label: "Confirm new password",
            labelId: "confirm-new-password",
            name: "new-host-password-confirm",
            autoComplete: "new-password",
            secret: true,
            value: password2,
            onValueChange: setPassword2,
            error: password2Error
          }
        ]}
      >
        <Button type="submit" variant="dappnode" disabled={!isValid} onClick={onChangePassword}>
          Change password
        </Button>
      </InputForm>
    </Card>
  );
}
