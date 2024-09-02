import React from "react";
import { FiWifiOff } from "react-icons/fi";
import ErrorView from "components/ErrorView";
import { discordInviteUrl, githubNewIssueDappnodeUrl } from "params";
import { StandaloneContainer } from "./StandaloneContainer";

export const NoConnection = ({ error }: { error?: Error | string }) => (
  <StandaloneContainer TopIcon={FiWifiOff} title="No connection">
    <div className="text">
      Could not connect to Dappnode. Please make sure your VPN connection is still active. Otherwise, stop the
      connection and reconnect and try accessing this page again. If the problems persist, please reach us via{" "}
      <a href={discordInviteUrl}>Discord</a> or <a href={githubNewIssueDappnodeUrl}>opening a Github issue</a>.
    </div>

    {error && <ErrorView error={error} hideIcon />}
  </StandaloneContainer>
);
