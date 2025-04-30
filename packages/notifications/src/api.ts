import { Notification, NotificationPayload } from "@dappnode/types";

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
  async getBannerNotifications(timestamp?: string): Promise<Notification[]> {
    const url = new URL("/api/v1/notifications", `${this.rootUrl}:8080`);

    url.searchParams.append("isBanner", "true");

    if (timestamp) {
      url.searchParams.append("timestamp", timestamp);
    }

    const response = await fetch(url.toString());
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
   * Set a notification as seen by providing its ID
   */
  async setNotificationSeenByID(id: number): Promise<void> {
    const url = new URL(`/api/v1/notifications/${id}/seen`, `${this.rootUrl}:8080`);

    await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
