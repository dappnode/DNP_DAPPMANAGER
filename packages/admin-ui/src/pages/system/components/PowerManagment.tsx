import React from "react";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
// Components
import Card from "components/Card";
import Columns from "components/Columns";
import Button from "components/Button";
import { withToast } from "components/toast/Toast";

function PowerManagment() {
  async function reboot() {
    try {
      await new Promise(resolve =>
        confirm({
          title: `Rebooting host`,
          text: `Are you sure you want to reboot the host machine? Only do this if it’s strictly necessary.`,
          label: "Reboot",
          onClick: resolve,
          variant: "danger"
        })
      );

      await withToast(() => api.rebootHost(), {
        message: "Rebooting host...",
        onSuccess: "Rebooted host"
      });
    } catch (e) {
      console.error("Error rebotting host", e);
    }
  }

  async function powerOff() {
    try {
      // Since there are two consecutive modals, the async form must be used
      await new Promise(resolve =>
        confirm({
          title: `Powering off host`,
          text: `WARNING! Your machine will power off and you will not be able to turn it back on without physical access or a remote way to switch on the power.`,
          label: "Power off",
          onClick: resolve,
          variant: "danger"
        })
      );

      await new Promise(resolve =>
        confirm({
          title: `Are you sure?`,
          text: `Please make sure you have a way of turning the host machine’s power back on.`,
          label: "I am sure, power off",
          onClick: resolve,
          variant: "danger"
        })
      );

      await withToast(() => api.poweroffHost(), {
        message: "Powering off host...",
        onSuccess: "Powered off host"
      });
    } catch (e) {
      console.error("Error powering off host", e);
    }
  }

  return (
    <Card className="backup">
      {/* Get backup */}
      <Columns>
        <div>
          <div className="subtle-header">REBOOT HOST</div>
          <p>
            Only use this functionality as last resort and when all other
            troubleshooting options have been exhausted.
          </p>
          <Button
            onClick={reboot}
            // disabled={isOnProgress}
            variant="outline-danger"
          >
            Reboot
          </Button>
        </div>

        {/* Restore backup */}
        <div>
          <div className="subtle-header">POWER OFF HOST</div>
          <p>
            Your machine will power off and you will not be able to access the
            Admin UI until you turn it back on.
          </p>
          <Button
            onClick={powerOff}
            // disabled={isOnProgress}
            variant="outline-danger"
          >
            Power off
          </Button>
        </div>
      </Columns>
    </Card>
  );
}

export default PowerManagment;
