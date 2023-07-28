import React from "react";
import { api } from "api";
import Card from "components/Card";
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import { withToastNoThrow } from "components/toast/Toast";

export function ClearMainDb() {
  async function cleanDb() {
    await new Promise<void>(resolve =>
      confirm({
        title: `Deleting main database`,
        text: `This action cannot be undone. You should only delete the database in response to a problem.`,
        label: "Delete",
        onClick: resolve
      })
    );

    await withToastNoThrow(() => api.cleanDb(), {
      message: "Deleting main database...",
      onSuccess: "Deleted main database"
    });
  }

  return (
    <Card>
      <p>
        Remove the local database which contains critical information about your
        DAppNode, such as the dyndns identity, Ips registry, telegram
        configuration and more
      </p>

      <Button onClick={cleanDb}>Clear main database</Button>
    </Card>
  );
}
