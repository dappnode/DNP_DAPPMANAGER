import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Copy, Check, TriangleAlert } from "lucide-react";
import { apiAuth } from "api";
import { ReqStatus } from "types";
import { validatePasswordsMatch, validateStrongPassword } from "utils/validation";
import { NewPageLayout } from "pages-new/layouts";
import { TypographyH1 } from "components/primitives/typography";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Separator } from "components/primitives/separator";
import { Alert, AlertDescription, AlertTitle } from "components/primitives/alert";
import { Spinner } from "components/primitives/spinner";
import dappnodeLogo from "img/dappnode-logo-wide-min.png";

export function RegisterPage({ refetchStatus }: { refetchStatus: () => Promise<void> }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string>();
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  const passwordError = validateStrongPassword(password);
  const password2Error = validatePasswordsMatch(password, password2);
  const isValid = password && password2 && !passwordError && !password2Error;

  async function onRegister() {
    if (isValid)
      try {
        setReqStatus({ loading: true });
        const res = await apiAuth.register({ username, password });
        setRecoveryToken(res.recoveryToken);
        setReqStatus({ result: true });
      } catch (e) {
        setReqStatus({ error: e as Error });
      }
  }

  function onCopiedRecoveryToken() {
    refetchStatus()?.catch(() => {});
  }

  if (recoveryToken) {
    return <CopyRecoveryToken recoveryToken={recoveryToken} onCopiedRecoveryToken={onCopiedRecoveryToken} />;
  }

  const errorMessage = reqStatus.error instanceof Error ? reqStatus.error.message : reqStatus.error;

  return (
    <NewPageLayout>
      <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:px-page-x tw:py-page-y">
        <Card className="tw:w-full tw:max-w-md">
          <CardContent className="tw:flex tw:flex-col tw:items-center tw:gap-6">
            {/* Icon */}
            <div className="tw:flex tw:size-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10">
              <ShieldCheck className="tw:size-8 tw:text-primary" />
            </div>

            {/* Title */}
            <TypographyH1 className="tw:text-2xl">Login</TypographyH1>

            {/* Description */}
            <p className="tw:text-center tw:text-sm tw:leading-relaxed tw:text-muted-foreground">
              Welcome! To protect your Dappnode register an admin password. It is recommended to use a password manager
              to set a strong password.
            </p>

            {/* Form */}
            <form
              className="tw:flex tw:w-full tw:flex-col tw:gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                onRegister();
              }}
            >
              {/* Username */}
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>

              {/* New password */}
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label htmlFor="register-password">New password</Label>
                <div className="tw:relative">
                  <Input
                    id="register-password"
                    name="new-password"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className="tw:pr-9"
                    aria-invalid={!!password && !!passwordError}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="tw:absolute tw:right-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:bg-transparent tw:text-muted-foreground tw:hover:text-foreground tw:transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="tw:size-4" /> : <Eye className="tw:size-4" />}
                  </button>
                </div>
                {password && passwordError && <p className="tw:text-sm tw:text-destructive">{passwordError}</p>}
              </div>

              {/* Confirm password */}
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label htmlFor="register-password2">Confirm new password</Label>
                <div className="tw:relative">
                  <Input
                    id="register-password2"
                    name="new-password"
                    autoComplete="new-password"
                    type={showPassword2 ? "text" : "password"}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="Confirm your password"
                    className="tw:pr-9"
                    aria-invalid={!!password2 && !!password2Error}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="tw:absolute tw:right-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:bg-transparent tw:text-muted-foreground tw:hover:text-foreground tw:transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword2 ? "Hide password" : "Show password"}
                  >
                    {showPassword2 ? <EyeOff className="tw:size-4" /> : <Eye className="tw:size-4" />}
                  </button>
                </div>
                {password2 && password2Error && <p className="tw:text-sm tw:text-destructive">{password2Error}</p>}
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" disabled={reqStatus.loading || !isValid} className="tw:w-full">
                {reqStatus.loading && <Spinner className="tw:mr-2" />}
                Register
              </Button>
            </form>

            {/* Status messages */}
            {reqStatus.result && (
              <Alert>
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Registered</AlertDescription>
              </Alert>
            )}
            {reqStatus.error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Footer */}
            <Separator />
            <img className="tw:h-6" src={dappnodeLogo} alt="Dappnode logo" />
          </CardContent>
        </Card>
      </div>
    </NewPageLayout>
  );
}

function CopyRecoveryToken({
  recoveryToken,
  onCopiedRecoveryToken
}: {
  recoveryToken: string;
  onCopiedRecoveryToken: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(recoveryToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement("textarea");
      textarea.value = recoveryToken;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <NewPageLayout>
      <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:px-page-x tw:py-page-y">
        <Card className="tw:w-full tw:max-w-md">
          <CardContent className="tw:flex tw:flex-col tw:items-center tw:gap-6">
            {/* Icon */}
            <div className="tw:flex tw:size-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10">
              <ShieldCheck className="tw:size-8 tw:text-primary" />
            </div>

            {/* Title */}
            <TypographyH1 className="tw:text-2xl">Recovery token</TypographyH1>

            {/* Description */}
            <p className="tw:text-center tw:text-sm tw:leading-relaxed tw:text-muted-foreground">
              Store the recovery token in a safe place. If you lose your password it will allow you to reset the admin
              account and register again.
            </p>

            {/* Recovery token box */}
            <div className="tw:relative tw:w-full tw:rounded-lg tw:border tw:border-border tw:bg-muted/50 tw:p-4 tw:pr-12 tw:font-mono tw:text-sm tw:break-all tw:text-foreground">
              {recoveryToken}
              <button
                type="button"
                onClick={handleCopy}
                className="tw:absolute tw:right-3 tw:top-3 tw:text-muted-foreground tw:hover:text-foreground tw:transition-colors"
                aria-label="Copy recovery token"
              >
                {copied ? <Check className="tw:size-4 tw:text-green-500" /> : <Copy className="tw:size-4" />}
              </button>
            </div>

            {/* Warning */}
            <Alert variant={"warning"}>
              <TriangleAlert className="tw:size-4" />
              <AlertDescription>
                If you also lose your recovery token you will have to directly access your machine.
              </AlertDescription>
            </Alert>

            {/* Confirm button */}
            <Button size="lg" onClick={onCopiedRecoveryToken} className="tw:w-full">
              I've copied the recovery token
            </Button>

            {/* Footer */}
            <Separator />
            <img className="tw:h-6" src={dappnodeLogo} alt="Dappnode logo" />
          </CardContent>
        </Card>
      </div>
    </NewPageLayout>
  );
}
