import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { apiAuth } from "api";
import { ReqStatus } from "types";
import { NewPageLayout } from "pages-new/layouts";
import { TypographyH1 } from "components/primitives/typography";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Separator } from "components/primitives/separator";
import { Alert, AlertDescription, AlertTitle } from "components/primitives/alert";
import { Spinner } from "components/primitives/spinner";
import { ResetPasswordPage } from "./ResetPasswordPage";
import dappnodeLogo from "img/dappnode-logo-wide-min.png";

const loginRootPath = "/";
const forgotPasswordPath = "/forgot-password";

export function LoginPage({ refetchStatus }: { refetchStatus: () => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setReqStatus({ error: e as Error });
    } finally {
      refetchStatus();
    }
  }

  function onForgotPassword() {
    navigate(forgotPasswordPath);
  }

  async function onSuccessfulReset() {
    await refetchStatus()?.catch(() => {});
    navigate(loginRootPath);
  }

  // Use minimal router since there only one possible path
  if (location.pathname === forgotPasswordPath) {
    return <ResetPasswordPage onSuccessfulReset={onSuccessfulReset} />;
  }

  const errorMessage = reqStatus.error instanceof Error ? reqStatus.error.message : reqStatus.error;

  return (
    <NewPageLayout>
      <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:px-page-x tw:py-page-y">
        <Card className="tw:w-full tw:max-w-md">
          <CardContent className="tw:flex tw:flex-col tw:items-center tw:gap-6">
            {/* Icon */}
            <div className="tw:flex tw:size-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10">
              <Lock className="tw:size-8 tw:text-primary" />
            </div>

            {/* Title */}
            <TypographyH1 className="tw:text-2xl">Login</TypographyH1>

            {/* Form */}
            <form
              className="tw:flex tw:w-full tw:flex-col tw:gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                onLogin();
              }}
            >
              {/* Username */}
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>

              {/* Password */}
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label htmlFor="login-password">Password</Label>
                <div className="tw:relative">
                  <Input
                    id="login-password"
                    name="current-password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="tw:pr-9"
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
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" disabled={reqStatus.loading || !password} className="tw:w-full">
                {reqStatus.loading && <Spinner className="tw:mr-2" />}
                Login
              </Button>
            </form>

            {/* Forgot password */}
            <Button variant="link" onClick={onForgotPassword}>
              Forgot password?
            </Button>

            {/* Status messages */}
            {reqStatus.result && (
              <Alert>
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Logged in</AlertDescription>
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
