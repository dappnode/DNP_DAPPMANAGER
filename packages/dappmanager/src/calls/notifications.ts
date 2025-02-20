import { logs } from "@dappnode/logger";

export async function notificationsGetVapidPublicKey(): Promise<string> {
  return await (await fetch("http://notifications.public.dappnode:8080/vapid-publicKey")).json();
}

export async function notificationsPostSubscription({
  subscription
}: {
  subscription: PushSubscriptionJSON;
}): Promise<void> {
  logs.info("notificationsPostSubscription", subscription);
  console.log("subscription", subscription);
  await fetch("http://notifications.public.dappnode:8080/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(subscription)
  });
}
