import React, { useState } from "react";
import BottomButtons from "../BottomButtons";
import { api } from "api";
import { docsUrl } from "params";

import { prettyDnpName } from "utils/format";
import { enableAutoUpdatesForPackageWithConfirm } from "pages/system/components/AutoUpdates";
import { clearIsInstallingLog } from "services/isInstallingLogs/actions";
import { withToast } from "components/toast/Toast";
import { continueIfCalleDisconnected } from "api/utils";
import { useDispatch } from "react-redux";
import Button from "components/Button";

export default function EnableNotifications({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  const [isInstalling, setIsInstalling] = useState(false);

  const dispatch = useDispatch();

  const notificationsPkgName = "testing.dnp.dappnode.eth"; // TODO: Change to notifications.dnp.dappnode.eth (import it from params)

  const installNotisPkg = async () => {
    try {
      setIsInstalling(true);
      await withToast(
        // If call errors with "callee disconnected", resolve with success
        continueIfCalleDisconnected(
          () =>
            api.packageInstall({
              name: notificationsPkgName
            }),
          notificationsPkgName
        ),
        {
          message: `Installing ${prettyDnpName(notificationsPkgName)}...`,
          onSuccess: `Installed ${prettyDnpName(notificationsPkgName)}`
        }
      );

      enableAutoUpdatesForPackageWithConfirm(notificationsPkgName).catch((e) => {
        console.error("Error on enableAutoUpdatesForPackageWithConfirm", e);
      });
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(clearIsInstallingLog({ id: notificationsPkgName }));
      setIsInstalling(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div className="title">Enable Dappnode's Notifications</div>
        <br />
        <div className="description">
          <p className="description-text">
            In order, to configure and recieve notifications from your installed packages, you need to install the
            notifications package first.
          </p>
          <Button
            variant="dappnode"
            disabled={isInstalling}
            onClick={() => {
              installNotisPkg();
            }}
          >
            {isInstalling ? "Installing..." : "Install Notifications"}
          </Button>
          <br />
          <br />

          <p>After the installation you can configure them in the Notifications tab.</p>
          <p>
            Learn more about notifications package and how to configure it in the{" "}
            <a href={docsUrl.notificationsOverview} className="learn-more">
              Dappnode's documentation
            </a>
          </p>
        </div>
      </div>

      <BottomButtons onBack={onBack} onNext={() => onNext()} />
      <br />
      <br />
    </div>
  );
}
