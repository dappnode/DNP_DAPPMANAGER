import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { passwordChangeInBackground } from "pages/system/actions";
// Components
import BottomButtons from "../BottomButtons";
import {
  validatePasswordsMatch,
  validateStrongPasswordAsDockerEnv
} from "utils/validation";
import { InputForm } from "components/InputForm";

/**
 * View to chose or change the Eth multi-client
 * There are three main options:
 * - Remote
 * - Full node
 * There may be multiple available light-clients and fullnodes
 */
export default function ChangeHostPassword({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  const dispatch = useDispatch();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const passwordError = validateStrongPasswordAsDockerEnv(password);
  const password2Error = validatePasswordsMatch(password, password2);
  const isValid = password && password2 && !passwordError && !password2Error;

  async function update() {
    if (isValid) {
      // Move ahead
      onNext();

      // Change password in the background and don't stop for errors
      // The user can change the password latter again if it failed
      dispatch(passwordChangeInBackground(password));
    }
  }

  return (
    <>
      <div className="header">
        <div className="title">Change host user password</div>
        <div className="description">
          Please change the host user password. The current password is the
          factory insecure default. Changing it to a strong password will
          protect your DAppNode from external attackers.
        </div>
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
      />

      <BottomButtons
        onBack={onBack}
        onNext={isValid ? update : onNext}
        nextTag={isValid ? undefined : "Skip"}
        nextVariant={isValid ? undefined : "outline-secondary"}
      />
    </>
  );
}
