import React from "react";
import Card from "components/Card";
import Switch from "components/Switch";
import { api, useApi } from "api";
import { withToast } from "components/toast/Toast";
import "./contentProviderSelector.scss";

export function ContentProviderSelector() {
  const mirrorProviderReq = useApi.mirrorProviderGet();
  const enabled = mirrorProviderReq.data?.enabled ?? false;

  const handleToggle = async () => {
    await withToast(() => api.mirrorProviderSet({ enabled: !enabled }), {
      message: `${enabled ? "Disabling" : "Enabling"} Dappnode Content Provider...`,
      onSuccess: `${enabled ? "Disabled" : "Enabled"} Dappnode Content Provider`
    });
    mirrorProviderReq.revalidate();
  };

  return (
    <Card spacing>
      <div className="content-provider-wrapper">
        <div>
          When enabled, packages are downloaded from the Dappnode content provider first instead of IPFS. Packages
          delivered through Dappnode infrastructure will appear as signed during installation.
        </div>
        <Switch
          checked={enabled}
          onToggle={handleToggle}
          disabled={mirrorProviderReq.isValidating || !mirrorProviderReq.data}
        />
      </div>
    </Card>
  );
}
