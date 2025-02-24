import { logs } from "@dappnode/logger";

const notificationsUrl = "http://notifications.public.dappnode:8080";

export async function notificationsGetVapidPublicKey(): Promise<string> {
  return (await (await fetch(`${notificationsUrl}/vapid-publicKey`)).json()).publicKey;
}

export async function notificationsPostSubscription({
  subscription
}: {
  subscription: PushSubscriptionJSON;
}): Promise<void> {
  logs.info("notificationsPostSubscription", subscription);
  console.log("subscription", subscription);
  await fetch(`${notificationsUrl}/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(subscription)
  });
}

export async function notificationsPostNewNotification({
  title,
  body
}: {
  title: string;
  body: string;
}): Promise<void> {
  await fetch(`${notificationsUrl}/send-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, body })
  });
}
