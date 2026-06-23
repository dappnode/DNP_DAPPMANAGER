import Card from "components/Card";
import SubTitle from "components/SubTitle";
import React from "react";
import { ChangeDappnodeWebName } from "./ChangeDappnodeWebName";
import { ClearCacheDb } from "./ClearCacheDb";
import { ClearMainDb } from "./ClearMainDb";
import { ContentProviderSelector } from "./ContentProviderSelector";
import { ReleaseTrustedKeysEditor } from "./ReleaseTrustedKeysEditor";
import { UiTelemetryToggle } from "./UiTelemetryToggle";
import { McpApiKey } from "./McpApiKey";

export function Advanced() {
  return (
    <>
      <SubTitle>Change DappNode Name</SubTitle>
      <Card spacing>
        <div>
          Dappnode name only affects to the User Web Interface. It's the name appears on the top navigation bar.
        </div>
        <ChangeDappnodeWebName />
      </Card>

      <SubTitle>Dappnode Content Provider</SubTitle>
      <ContentProviderSelector />

      <SubTitle>Release trusted keys</SubTitle>
      <ReleaseTrustedKeysEditor />

      <SubTitle>Clear cache db</SubTitle>
      <ClearCacheDb />

      <SubTitle>Clear main db</SubTitle>
      <ClearMainDb />

      <SubTitle>UI Telemetry</SubTitle>
      <Card spacing>
        <UiTelemetryToggle />
      </Card>

      <SubTitle>MCP API key</SubTitle>
      <McpApiKey />
    </>
  );
}
