import React from "react";
import { WifiOff, MessageCircle, Github } from "lucide-react";
import { NewPageLayout } from "pages-new/layouts";
import { Card, CardContent } from "components/primitives/card";
import { Separator } from "components/primitives/separator";
import { Alert, AlertDescription, AlertTitle } from "components/primitives/alert";
import { discordInviteUrl, githubNewIssueDappnodeUrl } from "params";
import dappnodeLogo from "img/dappnode-logo-wide-min.png";

export function NoConnectionPage({ error }: { error?: Error | string }) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <NewPageLayout>
      <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:px-page-x tw:py-page-y">
        <Card className="tw:w-full tw:max-w-md">
          <CardContent className="tw:flex tw:flex-col tw:items-center tw:gap-6">
            {/* Icon */}
            <div className="tw:flex tw:size-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-destructive/10">
              <WifiOff className="tw:size-8 tw:text-destructive" />
            </div>

            {/* Title */}
            <h1 className="tw:text-2xl tw:font-bold tw:tracking-tight tw:text-foreground">No connection</h1>

            {/* Description */}
            <p className="tw:text-center tw:text-sm tw:leading-relaxed tw:text-muted-foreground">
              Could not connect to Dappnode. Please make sure your VPN connection is still active. Otherwise, stop the
              connection and reconnect and try accessing this page again.
            </p>

            {/* Error detail */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Connection error:</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Help links */}
            <p className="tw:text-center tw:text-sm tw:text-muted-foreground">
              If the problems persist, please reach us via{" "}
              <a
                href={discordInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:inline-flex tw:items-center tw:gap-1 tw:text-primary tw:underline tw:underline-offset-4 tw:hover:text-primary/80"
              >
                <MessageCircle className="tw:size-3.5" />
                Discord
              </a>{" "}
              or{" "}
              <a
                href={githubNewIssueDappnodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:inline-flex tw:items-center tw:gap-1 tw:text-primary tw:underline tw:underline-offset-4 tw:hover:text-primary/80"
              >
                <Github className="tw:size-3.5" />
                opening a Github issue
              </a>
              .
            </p>

            {/* Footer */}
            <Separator />
            <img className="tw:h-6" src={dappnodeLogo} alt="Dappnode logo" />
          </CardContent>
        </Card>
      </div>
    </NewPageLayout>
  );
}
