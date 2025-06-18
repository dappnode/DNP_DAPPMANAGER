import { Notification, NotificationPayload, NotifierSubscription } from "@dappnode/types";

export class NotificationsApi {
  private readonly rootUrl: string;

  constructor(rootUrl: string = "http://notifier.notifications.dappnode") {
    this.rootUrl = rootUrl;
  }

  /**
   * Send a new notification
   */
  async sendNotification(notificationPaylaod: NotificationPayload): Promise<void> {
    await fetch(new URL("/api/v1/notifications", `${this.rootUrl}:8080`).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(notificationPaylaod)
    });
  }

  /**
   * Get all the notifications from the endpoint
   */
  async getAllNotifications(): Promise<Notification[]> {
    return await (await fetch(new URL("/api/v1/notifications", `${this.rootUrl}:8080`).toString())).json();
  }

  /**
   * Retrieve all "banner" notifications that should be displayed within the given timestamp range
   */
  async getBannerNotifications(timestamp?: number): Promise<Notification[]> {
    const url = new URL(`/api/v1/notifications?isBanner=true&timestamp=${timestamp}`, `${this.rootUrl}:8080`);

    const response = await fetch(url);
    return await response.json();
  }

  /**
   * Get the count of unseen notifications
   */
  async getUnseenNotificationsCount(): Promise<{ unseenCount: number }> {
    return await (await fetch(new URL("/api/v1/notifications/unseen", `${this.rootUrl}:8080`).toString())).json();
  }

  /**
   * Trigger reload of endpoint to make changes effective
   */
  async reloadEndpoints(): Promise<void> {
    await fetch(new URL("/api/v1/gatus/endpoints/reload", `${this.rootUrl}:8082`).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  /**
   * Set all non-banner notifications as seen
   */
  async setAllNotificationsSeen(): Promise<void> {
    const url = new URL("/api/v1/notifications/seen", `${this.rootUrl}:8080`);
    url.searchParams.append("isBanner", "false");

    await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  /**
   * Set a notification as seen by providing its correlationId
   */
  async setNotificationSeenByCorrelationID(correlationId: string): Promise<void> {
    const url = new URL(`/api/v1/notifications/${correlationId}/seen`, `${this.rootUrl}:8080`);

    await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  /**
   * Get public vapidKey from notifier service
   */
  async getVapidKey(): Promise<string | null> {
    const url = new URL("/api/v1/vapid/public-key", `${this.rootUrl}:8081`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Failed to fetch vapid public key");
    }
    return (await response.json()).publicKey;
  }

  /**
   * Get all Push subscriptions from notifier service
   */
  async fetchSubscriptions(): Promise<NotifierSubscription[]> {
    const url = new URL("/api/v1/subscriptions", `${this.rootUrl}:8081`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Failed to fetch subscriptions");
    }
    return await response.json();
  }

  /**
   * Delete a Push subscription by its endpoint
   */
  async deleteSubscription(endpoint: string): Promise<void> {
    const url = new URL(`/api/v1/subscriptions?endpoint=${endpoint}`, `${this.rootUrl}:8081`);
    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("Failed to delete subscription");
    }
  }

  /**
   * Post a new Push subscription to the notifier service
   */
  async postSubscription(subscription: PushSubscription): Promise<void> {
    const url = new URL("/api/v1/subscriptions", `${this.rootUrl}:8081`);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(subscription)
    });
    if (!response.ok) {
      throw new Error("Failed positing sub to notifier");
    }
  }
}
