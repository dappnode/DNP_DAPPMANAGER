import React, { useState } from "react";
import { useApi } from "api";
import { validateStrongPasswordAsDockerEnv, validatePasswordsMatch } from "utils/validation";
import { passwordChange } from "pages-new/utils/actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";

export function HostPasswordSection() {
  const passwordIsSecureReq = useApi.passwordIsSecure();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const passwordError = password ? validateStrongPasswordAsDockerEnv(password) : "";
  const password2Error = password2 ? validatePasswordsMatch(password, password2) : "";
  const isValid = password && password2 && !passwordError && !password2Error;

  function onChangePassword() {
    if (isValid) passwordChange(password);
  }

  const showInsecureWarning = passwordIsSecureReq.data === false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Host User Password</CardTitle>
        <CardDescription>
          Change the host machine&apos;s user password. Store it safely — you will never see it again.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        {showInsecureWarning && (
          <div className="tw:rounded-lg tw:border tw:border-yellow-500/30 tw:bg-yellow-50 tw:dark:bg-yellow-900/10 tw:p-3 tw:text-sm">
            <strong>Action recommended:</strong> Your host user password is still the factory default and is insecure.
            Change it to a strong password.
          </div>
        )}
        <div className="tw:space-y-2">
          <Label htmlFor="host-password">New password</Label>
          <Input
            id="host-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!passwordError}
          />
          {passwordError && <p className="tw:text-xs tw:text-destructive">{passwordError}</p>}
        </div>
        <div className="tw:space-y-2">
          <Label htmlFor="host-password-confirm">Confirm new password</Label>
          <Input
            id="host-password-confirm"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            aria-invalid={!!password2Error}
          />
          {password2Error && <p className="tw:text-xs tw:text-destructive">{password2Error}</p>}
        </div>
        <Button disabled={!isValid} onClick={onChangePassword}>
          Change Host Password
        </Button>
      </CardContent>
    </Card>
  );
}
