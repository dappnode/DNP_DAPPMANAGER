import React, { useState } from "react";
import { Lock, Eye, EyeOff, ExternalLink } from "lucide-react";
import { apiAuth } from "api";
import { ReqStatus } from "types";
import { docsUrl } from "params";
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

export function ResetPasswordPage({ onSuccessfulReset }: { onSuccessfulReset: () => void }) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  async function onReset() {
    try {
      setReqStatus({ loading: true });
      await apiAuth.recoverPass({ token });
      setReqStatus({ result: true });
      onSuccessfulReset();
    } catch (e) {
      setReqStatus({ error: e as Error });
    }
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
            <TypographyH1 className="tw:text-2xl">Reset Password</TypographyH1>

            {/* Description */}
            <p className="tw:text-center tw:text-sm tw:leading-relaxed tw:text-muted-foreground">
              Use your recovery token to reset the admin password and register again.
            </p>

            {/* Warning */}
            <Alert>
              <AlertTitle>Lost your recovery token?</AlertTitle>
              <AlertDescription>
                If you have lost your password and recovery token you have to directly access your machine via SSH or by
                connecting a keyboard and screen and follow{" "}
                <a
                  href={docsUrl.recoverPasswordGuide}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw:inline-flex tw:items-center tw:gap-1 tw:text-primary tw:underline tw:underline-offset-4 tw:hover:text-primary/80"
                >
                  this guide
                  <ExternalLink className="tw:size-3" />
                </a>
                .
              </AlertDescription>
            </Alert>

            {/* Form */}
            <form
              className="tw:flex tw:w-full tw:flex-col tw:gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                onReset();
              }}
            >
              {/* Recovery token */}
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label htmlFor="reset-token">Recovery token</Label>
                <div className="tw:relative">
                  <Input
                    id="reset-token"
                    name="recovery-token"
                    autoFocus
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your recovery token"
                    className="tw:pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="tw:absolute tw:right-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:bg-transparent tw:text-muted-foreground tw:hover:text-foreground tw:transition-colors"
                    tabIndex={-1}
                    aria-label={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? <EyeOff className="tw:size-4" /> : <Eye className="tw:size-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" disabled={reqStatus.loading || !token} className="tw:w-full">
                {reqStatus.loading && <Spinner className="tw:mr-2" />}
                Reset password
              </Button>
            </form>

            {/* Status messages */}
            {reqStatus.result && (
              <Alert>
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Password successfully reset.</AlertDescription>
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
