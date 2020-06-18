import React from "react";
import { api } from "api";
// Components
import Card from "components/Card";
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";

export default function DappmanagerDnpDappnodeEth() {
  async function cleanCache() {
    try {
      await new Promise(resolve =>
        confirm({
          title: `Deleting cache`,
          text: `This action cannot be undone. You should only clean the cache in response to a problem.`,
          label: "Clean cache",
          onClick: resolve
        })
      );

      await withToast(() => api.cleanCache(), {
        message: "Cleaning cache...",
        onSuccess: "Cleaning cache..."
      });
    } catch (e) {
      console.error("Error on cleanCache", e);
    }
  }
  /**
   * Title:
   * Clean cache
   */
  return (
    <Card>
      <div className="help-text" style={{ marginBottom: "1rem" }}>
        Remove the local cache of Aragon Package Manager (APM) entries,
        manifests, avatars. Also remove the user action logs shown in the
        Activity tab.
      </div>

      <Button onClick={cleanCache}>Clean cache</Button>
    </Card>
  );
}
