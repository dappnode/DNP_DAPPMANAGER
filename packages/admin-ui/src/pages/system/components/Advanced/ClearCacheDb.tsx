import React from "react";
import { api } from "api";
import Card from "components/Card";
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import { withToastNoThrow } from "components/toast/Toast";

export function ClearCacheDb() {
  async function cleanCache() {
    await new Promise<void>(resolve =>
      confirm({
        title: `Deleting cache`,
        text: `This action cannot be undone. You should only delete the cache in response to a problem.`,
        label: "Clean cache",
        onClick: resolve
      })
    );

    await withToastNoThrow(() => api.cleanCache(), {
      message: "Deleting cache...",
      onSuccess: "Deleted cache"
    });
  }

  return (
    <Card spacing>
      <p>
        Remove the local cache of Aragon Package Manager (APM) entries,
        manifests, avatars. Also remove the user action logs shown in the
        Activity tab.
      </p>

      <Button onClick={cleanCache}>Clear cache database</Button>
    </Card>
  );
}
