import React from "react";
import { api } from "api";
import Card from "components/Card";
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import { withToastNoThrow } from "components/toast/Toast";

export function UpdateUpgrade() {
  async function updateUpgrade() {
    await new Promise<void>(resolve =>
      confirm({
        title: `Updating and upgrading the host machine`,
        text: `This action might update docker among other packages, you might loose connectivity temporarily to the dappnode.`,
        label: "Update and upgrade",
        onClick: resolve
      })
    );

    await withToastNoThrow(() => api.updateUpgrade(), {
      message: "Updating and upgrading...",
      onSuccess: "Updated and upgraded"
    });
  }
  return (
    <Card spacing>
      <p>
        Update and upgrade the host machine. This action updates and upgrades the
        list of packages of the host machine. This action might require a reboot
        of the host machine, you will receive a notification if so.
      </p>

      <Button variant="outline-danger" onClick={updateUpgrade}>
        Update and upgrade
      </Button>
    </Card>
  );
}
