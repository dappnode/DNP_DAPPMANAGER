import React from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { usePwaInstall } from "hooks/PWA/usePwaInstall";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";

export default function PushNotisPremium() {
  const { isPwa, canInstall, promptInstall } = usePwaInstall();
  const {
    subscription: sub,
    subscriptionsList,
    isSubInNotifier,
    deleteSubscription,
    requestPermission,
    permission,
    subscribeBrowser
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
          {!isSubInNotifier && sub && <p>Subscription not found in notifier</p>}
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
        <Card>
          
        </Card>
        <Card>
          <h3>📝 Notifier Subs</h3>
          {sub && isSubInNotifier ? <p>Subscription exists in notifier</p> : <p>Subscription not found in notifier</p>}

          {subscriptionsList && subscriptionsList.length > 0 ? (
            <ul>
              {subscriptionsList.map((sub, index) => (
                <li key={index}>
                  <details>
                    <summary>Subscription {index + 1}</summary>
                    <pre>{sub.endpoint}</pre>
                  </details>{" "}
                </li>
              ))}
            </ul>
          ) : (
            <p>No subscriptions found in notifier</p>
          )}
        </Card>
      </div>
    </>
  );
}
