import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { passwordChangeInBackground } from "pages/system/actions";
// Components
import Input from "components/Input";
import Switch from "components/Switch";
import { ErrorFeedback } from "components/PasswordForm";
import BottomButtons from "../BottomButtons";

/**
 * View to chose or change the Eth multi-client
 * There are three main options:
 * - Remote
 * - Light client
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

  const [input, setInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const errors = [];
  if (input && input.length < 8)
    errors.push("Password must be at least 8 characters long");
  if (input.includes("'")) errors.push("Password MUST not include the quotes");
  if (!/^([\x20-\x7F])*$/.test(input))
    errors.push("Password must include only simple ASCII characters");

  const errorsConfirm = [];
  if (confirmInput && confirmInput !== input)
    errorsConfirm.push("Passwords do not match");

  const invalid =
    !input || !confirmInput || errors.length > 0 || errorsConfirm.length > 0;

  async function update() {
    if (invalid) return;

    // Move ahead
    onNext();

    // Change password in the background and don't stop for errors
    // The user can change the password latter again if it failed
    dispatch(passwordChangeInBackground(input));
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

      <div className="change-password-form">
        <div>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="password..."
            value={input}
            onValueChange={setInput}
            onEnterPress={update}
            isInvalid={errors.length > 0}
          />
          <ErrorFeedback errors={errors} />
        </div>

        <div>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="confirm password..."
            value={confirmInput}
            onValueChange={setConfirmInput}
            onEnterPress={update}
            isInvalid={errorsConfirm.length > 0}
          />
          <ErrorFeedback errors={errorsConfirm} />
        </div>

        <span className="separator" />
        <div className="toggle">
          <Switch
            checked={showPassword}
            onToggle={() => setShowPassword(_show => !_show)}
            label="Show my password"
            id="switch-password-visibility"
            highlightOnHover
          />
        </div>
      </div>

      <BottomButtons
        onBack={onBack}
        onNext={invalid ? onNext : update}
        nextTag={invalid ? "Skip" : undefined}
        nextVariant={invalid ? "outline-secondary" : undefined}
      />
    </>
  );
}
