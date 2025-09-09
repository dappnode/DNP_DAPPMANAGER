import React, { useState, useEffect } from "react";
import { usePwaInstall } from "pages/system/components/App/PwaInstallContext";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";
import Button from "./Button";
import Loading from "./Loading";
import newTabProps from "utils/newTabProps";
import { Accordion } from "react-bootstrap";
import { MdClose } from "react-icons/md";
import "./notificationsMain.scss";
import "./pwaPermissions.scss";
import { docsUrl } from "params";

export function PwaPermissionsModal() {
  const { isPwa } = usePwaInstall();
  const { permission, isSubscribing, requestPermission, permissionLoading } = useHandleSubscription();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isPwa && permission === "default") {
      setShowModal(true);
    }
  }, [permission, isPwa]);

  return (
    showModal && (
      <div className="pwa-permissions-modal-bg">
        <div className="pwa-permissions-modal">
          {!permissionLoading && (
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
              <MdClose />
            </button>
          )}
          {permissionLoading ? (
            <Loading steps={["Waiting for permissions approval"]} />
          ) : permission === "default" ? (
            <>
              <h4>Enable App Notifications</h4>
              <p>To receive push notifications on your device, you need to allow notifications.</p>
              <p>
                Click the button below, then select <b>Allow</b> in your browser's permission prompt.
              </p>
              <Button variant="dappnode" onClick={requestPermission}>
                Grant permission
              </Button>
            </>
          ) : permission === "denied" ? (
            <>
              <h4>App Notifications blocked</h4>
              <p>
                To receive notifications from the app, you'll need to re-enable notification permissions in your browser
                settings. Follow our step-by-step guide to fix it.
              </p>
              <Button variant="warning" href={docsUrl.pwaResetPermissions} {...newTabProps}>
                <div className="btn-text">Check Docs</div>
              </Button>
            </>
          ) : permission === "granted" && isSubscribing ? (
            <Loading steps={["Subscribing device"]} />
          ) : (
            <>
              <h4>Your App is successfully configured!</h4>

              <p>You can now manage notifications for your devices in the Notifications tab.</p>
              <Button
                variant="dappnode"
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Finish
              </Button>
            </>
          )}
        </div>{" "}
      </div>
    )
  );
}

export function PwaPermissionsAlert() {
  const { isPwa } = usePwaInstall();
  const { permission } = useHandleSubscription();

  const [isOpen, setIsOpen] = useState(false);
  const [hasClosed, setHasClosed] = useState(false);

  const showAlert = isPwa && permission === "denied";

  if (!showAlert) return null;

  return (
    !hasClosed && (
      <Accordion defaultActiveKey={isOpen ? "0" : "1"} className="banner-notifications-col">
        <Accordion.Toggle
          as={"div"}
          eventKey="0"
          onClick={() => setIsOpen(!isOpen)}
          className={`banner-card high-priority`}
        >
          <div className="banner-header">
            <h5>App Notifications blocked</h5>
            <button
              className="close-btn"
              onClick={() => {
                setHasClosed(true);
              }}
            >
              <MdClose />
            </button>
          </div>
          <Accordion.Collapse eventKey="0">
            <div className="banner-body">
              <p>
                To receive notifications from the app, you'll need to re-enable notification permissions in your browser
                settings. Follow our step-by-step guide to fix it.
              </p>
              <Button variant="warning" href={docsUrl.pwaResetPermissions} {...newTabProps}>
                <div className="btn-text">Check Docs</div>
              </Button>
            </div>
          </Accordion.Collapse>
        </Accordion.Toggle>
      </Accordion>
    )
  );
}
