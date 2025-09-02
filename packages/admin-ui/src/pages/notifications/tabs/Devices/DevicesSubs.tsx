import Card from "components/Card";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { MdBeenhere, MdClose, MdEdit, MdOutgoingMail } from "react-icons/md";
import React, { useEffect, useRef, useState } from "react";
import { NotifierSubscription } from "@dappnode/types";
import Button from "components/Button";
import { api } from "api";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";
import { usePwaInstall } from "pages/system/components/App/PwaInstallContext";
import { usePwaSubtabUrl } from "hooks/PWA/usePwaSubtabUrl";
import Loading from "components/Loading";
import newTabProps from "utils/newTabProps";
import { docsUrl } from "params";
import "./devicesSubs.scss";

export function DevicesSubs() {
  const {
    subscription: browserSub,
    subscriptionsList,
    isSubscribing,
    isSubInNotifier,
    deleteSubscription,
    requestPermission,
    permission,
    permissionLoading,
    subscribeBrowser,
    revalidateSubs
  } = useHandleSubscription();
  const { isPwa, isFullscreenOn } = usePwaInstall();
  const pwaSubtabUrl = usePwaSubtabUrl();

  return (
    <div className="devices-subs-container">
      <div>
        <h5>Current Device</h5>
        <Card className="current-device-card">
          {isFullscreenOn ? (
            <div className="fullscreen-card">
              <h5>Exit full screen mode</h5>
              <p>To manage your current device, please exit full screen mode.</p>
              Some features may not work as expected while in full screen.
            </div>
          ) : (
            <>
              {isPwa && permission ? (
                permissionLoading ? (
                  <Loading steps={["Waiting for permissions approval"]} />
                ) : permission === "denied" ? (
                  <div>
                    <p>Notifications permission denied.</p>
                    <p>Grant notification permission for this App in your browser settings to receive notifications.</p>
                    <Button variant="warning" href={docsUrl.pwaResetPermissions} {...newTabProps}>
                      Check Docs
                    </Button>
                  </div>
                ) : permission === "default" ? (
                  <div>
                    <p>
                      To receive notifications in your device, it's mandatory granting the notification permission in
                      your App.
                    </p>
                    <p>
                      Click the button below and then <b>click 'Allow' in the pop-up modal</b>.
                    </p>

                    <Button variant="dappnode" onClick={requestPermission}>
                      Grant permission
                    </Button>
                  </div>
                ) : isSubInNotifier ? (
                  <div>Your device is already subscribed to push notifications.</div>
                ) : isSubscribing ? (
                  <Loading steps={["Subscribing device"]} />
                ) : (
                  <div>
                    <p>Your device is not subscribed to push notifications.</p>
                    <Button variant="dappnode" onClick={subscribeBrowser}>
                      Subscribe Device
                    </Button>
                  </div>
                )
              ) : (
                <>
                  <p>To check your device status, please open the Dappnode App.</p>
                  <p>If you haven't installed the app yet, click the button below.</p>
                  <Button href={pwaSubtabUrl} variant="dappnode">
                    Install App
                  </Button>
                </>
              )}
            </>
          )}
        </Card>
      </div>
      <div>
        <h5>Subscribed Devices</h5>

        {subscriptionsList && subscriptionsList.length > 0 ? (
          <>
            {subscriptionsList.map((sub, index) => (
              <SubscriptionCard
                key={index}
                sub={sub}
                browserSubEndpoint={browserSub?.endpoint}
                deleteSubscription={deleteSubscription}
                revalidateSubs={revalidateSubs}
              />
            ))}
          </>
        ) : (
          <Card>No subscriptions found</Card>
        )}
      </div>
    </div>
  );
}

function SubscriptionCard({
  sub,
  browserSubEndpoint,
  deleteSubscription,
  revalidateSubs
}: {
  sub: NotifierSubscription;
  browserSubEndpoint: string | undefined;
  deleteSubscription: (endpoint: string) => Promise<void>;
  revalidateSubs: () => Promise<boolean>;
}) {
  const [editAlias, setEditAlias] = useState(false);
  const [newAlias, setNewAlias] = useState(sub.alias);
  const aliasInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editAlias && aliasInputRef.current) {
      aliasInputRef.current.focus();
    }
  }, [editAlias]);

  async function handleUpdateAlias(subEndpoint: string = sub.endpoint || "", alias: string = newAlias) {
    try {
      await api.notificationsUpdateSubAlias({ endpoint: subEndpoint, alias });
      revalidateSubs();
    } catch (error) {
      console.error("Error updating alias:", error);
    } finally {
      setEditAlias(false);
    }
  }
  return (
    <Card className="subscription-card">
      <div className="alias-info">
        {editAlias ? (
          <input
            ref={aliasInputRef}
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUpdateAlias();
              }
              if (e.key === "Escape") {
                setEditAlias(false);
                setNewAlias(sub.alias);
              }
            }}
          />
        ) : (
          <>
            <span>{sub.alias}</span>
            {browserSubEndpoint && browserSubEndpoint === sub.endpoint && (
              <OverlayTrigger overlay={<Tooltip id="current-device">Current Device</Tooltip>} placement="top">
                <MdBeenhere className="current-tag" />
              </OverlayTrigger>
            )}
          </>
        )}
      </div>
      <div className="btns-container">
        {editAlias ? (
          <>
            <Button
              onClick={() => {
                setEditAlias(false);
                setNewAlias(sub.alias);
              }}
              variant="outline-danger"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateAlias()}
              variant="dappnode"
              disabled={!newAlias || newAlias === sub.alias}
            >
              Update
            </Button>
          </>
        ) : (
          <>
            <OverlayTrigger overlay={<Tooltip id="rename-sub">Send test notification</Tooltip>} placement="top">
              <div className="icon-btns" onClick={() => api.notificationsSendSubTest({ endpoint: sub.endpoint })}>
                <MdOutgoingMail />
              </div>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id="rename-sub">Rename subscription</Tooltip>} placement="top">
              <div className="icon-btns" onClick={() => setEditAlias(true)}>
                <MdEdit />
              </div>
            </OverlayTrigger>
            {sub.endpoint && (
              <OverlayTrigger overlay={<Tooltip id="delete-sub">Delete subscription</Tooltip>} placement="top">
                <div className="icon-btns" onClick={() => deleteSubscription(sub.endpoint!)}>
                  <MdClose />
                </div>
              </OverlayTrigger>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
