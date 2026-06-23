import React, { useState } from "react";
import { apiAuth } from "api";
import { toast } from "sonner";
import { validateStrongPassword, validatePasswordsMatch } from "utils/validation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";

export function ChangePasswordSection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const passwordError = newPassword ? validateStrongPassword(newPassword) : "";
  const password2Error = newPassword2 ? validatePasswordsMatch(newPassword, newPassword2) : "";
  const isValid = oldPassword && newPassword && newPassword2 && !passwordError && !password2Error;

  async function onChangePassword() {
    if (!isValid) return;
    const toastId = toast.loading("Changing password...");
    try {
      await apiAuth.changePass({ password: oldPassword, newPassword });
      toast.success("Password changed successfully. Please log in again.", { id: toastId });
      await apiAuth.logoutAndReload();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Change UI Password</CardTitle>
        <CardDescription>Change the password used to access the Dappnode admin UI.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:space-y-2">
          <Label htmlFor="old-password">Current password</Label>
          <Input
            id="old-password"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div className="tw:space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={!!passwordError}
          />
          {passwordError && <p className="tw:text-xs tw:text-destructive">{passwordError}</p>}
        </div>
        <div className="tw:space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            aria-invalid={!!password2Error}
          />
          {password2Error && <p className="tw:text-xs tw:text-destructive">{password2Error}</p>}
        </div>
        <Button disabled={!isValid} onClick={onChangePassword}>
          Change Password
        </Button>
      </CardContent>
    </Card>
  );
}
