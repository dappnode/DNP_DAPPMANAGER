import React from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { usePwaInstall } from "hooks/PWA/usePwaInstall";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";
import { PushNotificationsSubs } from "./PushNotificationsSubs";

export default function PushNotisPremium() {
  const { isPwa, canInstall, promptInstall } = usePwaInstall();
  const {
    subscription: sub,
    subscriptionsList,
    isSubInNotifier,
    deleteSubscription,
    requestPermission,
    permission,
    subscribeBrowser,
    revalidateSubs
  } = useHandleSubscription();

  return (
    <>
      <SubTitle>Push Notis Premium</SubTitle>
      <div>
        <Card>
          <h3>📱 Is PWA ?</h3>
          <p>{isPwa ? "Yes" : "No"}</p>
          {canInstall ? (
            <button onClick={promptInstall} disabled={!canInstall}>
              Install PWA
            </button>
          ) : (
            <div>PWA already installed or not available</div>
          )}
        </Card>

        <Card>
          <h3>🌐 Browser Status</h3>
          <p>Permission: {permission}</p>
          <p>Subscribed: {sub && isSubInNotifier ? "Yes" : "No"}</p>
          {!sub && <p>Subscription not found</p>}
          {sub && isSubInNotifier ? <p>Subscription exists in notifier</p> : <p>Subscription not found in notifier</p>}
          {permission === "default" ? (
            <button onClick={requestPermission}>request Permission</button>
          ) : permission === "denied" ? (
            <p>Permission denied</p>
          ) : (
            <p>Permission granted</p>
          )}
          {sub && (
            <>
              <details style={{ marginTop: 10 }}>
                <summary>Browser Subscription</summary>
                <pre style={{ maxHeight: 200, overflow: "auto" }}>{JSON.stringify(sub.toJSON(), null, 2)}</pre>
              </details>
              <button onClick={() => deleteSubscription(sub.endpoint)}>Delete subscription</button>
            </>
          )}
          {permission === "granted" && !isSubInNotifier && (
            <button onClick={subscribeBrowser}>Subscribe browser</button>
          )}
        </Card>

        <PushNotificationsSubs
          subscriptionsList={subscriptionsList}
          browserSubEndpoint={sub?.endpoint}
          deleteSubscription={deleteSubscription}
          revalidateSubs={revalidateSubs}
        />
      </div>
    </>
  );
}
