import { logs } from "@dappnode/logger";

const notificationsUrl = "http://notifier.notifications.dappnode:8080";

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

export async function notificationsGetSubscription({
  subscription
}: {
  subscription: PushSubscription;
}): Promise<PushSubscription | null> {
  // URL-encode the endpoint before appending it to the request URL
  const encodedEndpoint = encodeURIComponent(subscription.endpoint);

  const response = await fetch(`${notificationsUrl}/subscriptions?endpoint=${encodedEndpoint}`, {
    method: "GET"
  });

  if (response.status === 404) return null; // Return null if subscription is not found

  if (!response.ok) throw new Error(`Error fetching subscription: ${response.statusText}`);

  return await response.json(); // Return the subscription if found
}
