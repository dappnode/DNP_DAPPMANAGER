import { NotificationsApi } from "./api.js";
import { NotificationsManifest } from "./manifest.js";
import { CustomEndpoint, GatusEndpoint, Notification, NotificationsConfig } from "@dappnode/types";

class Notifications {
  private readonly api: NotificationsApi;
  private readonly manifest: NotificationsManifest;

  constructor(rootUrl: string = "http://notifier.notifications.dappnode") {
    this.api = new NotificationsApi(rootUrl);
    this.manifest = new NotificationsManifest();
  }

  /**
   * Send a new notification
   */
  async sendNotification(notification: Notification): Promise<void> {
    await this.api.sendNotification(notification);
  }

  /**
   * Get all the notifications
   */
  async getAll(): Promise<Notification[]> {
    return await this.api.getAllNotifications();
  }

  /**
   * Get gatus and custom endpoints indexed by dnpName
   */
  async getEndpoints(): Promise<{
    [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[] };
  }> {
    return await this.manifest.getEndpoints();
  }

  /**
   * Update endpoint properties
   */
  async updateEndpoints(dnpName: string, notificationsConfig: NotificationsConfig): Promise<void> {
    await this.manifest.updateEndpoints(dnpName, notificationsConfig);
    await this.api.reloadEndpoints();
  }
}

export const notifications = new Notifications();
