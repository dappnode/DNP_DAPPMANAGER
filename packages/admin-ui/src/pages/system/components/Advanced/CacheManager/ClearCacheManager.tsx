import React from "react";
import { api } from "api";
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";

export default function ClearCache() {
  async function cleanCache() {
    try {
      await new Promise<void>(resolve =>
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
  return (
    <>
      <div className="subtle-header">CLEAR CACHE CONTENT</div>
      <p>
        Remove the local cache of Aragon Package Manager (APM) entries,
        manifests, avatars. Also remove the user action logs shown in the
        Activity tab.
      </p>

      <Button onClick={cleanCache}>Clear cache</Button>
    </>
  );
}
