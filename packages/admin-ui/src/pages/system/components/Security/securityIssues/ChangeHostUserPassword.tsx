import React, { useState } from "react";
import { useDispatch } from "react-redux";
import * as a from "../../../actions";
import { validatePasswordsMatch, validateStrongPasswordAsDockerEnv } from "utils/validation";
// Components
import Card from "components/Card";
import Button from "components/Button";
import { InputForm } from "components/InputForm";

export default function ChangeHostUserPassword() {
  const dispatch = useDispatch();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const passwordError = validateStrongPasswordAsDockerEnv(password);
  const password2Error = validatePasswordsMatch(password, password2);
  const isValid = password && password2 && !passwordError && !password2Error;
  function onChangePassword() {
    if (isValid) dispatch(a.passwordChange(password));
  }

  return (
    <Card spacing>
      <div>
        Please change the host user password. The current password is the factory insecure default. Changing it to a
        strong password will protect your DAppNode from external attackers.
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
            name: "new-host-password",
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
