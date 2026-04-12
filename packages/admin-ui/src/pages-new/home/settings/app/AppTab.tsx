import React from "react";
import { useNavigate } from "react-router-dom";
import { withLegacyBase } from "utils/path";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Smartphone, ExternalLink } from "lucide-react";

/**
 * App tab — redirects to the legacy PWA-install page which requires
 * special browser APIs and an HTTPS context that only the legacy
 * router can provide.
 */
export function AppTab() {
  const navigate = useNavigate();

  return (
    <div className="tw:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Dappnode App</CardTitle>
          <CardDescription>
            The Dappnode app lets you connect to the Dappmanager on mobile or desktop and receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="tw:space-y-4">
          <div className="tw:flex tw:items-start tw:gap-3 tw:rounded-lg tw:border tw:p-4">
            <Smartphone className="tw:size-8 tw:text-muted-foreground tw:shrink-0" />
            <div>
              <p className="tw:text-sm tw:font-medium">Install as Progressive Web App</p>
              <p className="tw:text-xs tw:text-muted-foreground tw:mt-1">
                The PWA install flow requires a secure HTTPS context and specific browser APIs. Use the button below to
                open the legacy install page where you can complete the setup.
              </p>
            </div>
          </div>

          <Button onClick={() => navigate(withLegacyBase("system/app"))}>
            <ExternalLink className="tw:size-3.5" />
            Open PWA Install Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
