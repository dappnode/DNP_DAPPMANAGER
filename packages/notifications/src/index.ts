import { NotificationsApi } from "./api.js";
import { NotificationsManifest } from "./manifest.js";
import { CustomEndpoint, GatusEndpoint, Notification, NotificationPayload, NotificationsConfig } from "@dappnode/types";

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
  async sendNotification(notificationPayload: NotificationPayload): Promise<void> {
    await this.api.sendNotification(notificationPayload);
  }

  /**
   * Get all the notifications
   */
  async getAllNotifications(): Promise<Notification[]> {
    return await this.api.getAllNotifications();
  }
  
  /**
   * Get banner notifications that should be displayed within the given timestamp range
   */
  async getBannerNotifications(timestamp?: number): Promise<Notification[]> {
    return await this.api.getBannerNotifications(timestamp);
  }

  /**
   * Get the count of unseen notifications
   */
  async getUnseenNotificationsCount(): Promise<number> {
    return (await this.api.getUnseenNotificationsCount()).unseenCount;
  }

  /**
   * Set all non-banner notifications as seen
   */
  async setAllNotificationsSeen(): Promise<void> {
    return await this.api.setAllNotificationsSeen();
  }
  /**
   * Set a notification as seen by providing its ID
   */
  async setNotificationSeenByCorrelationID(correlationId:string): Promise<void> {
    return await this.api.setNotificationSeenByCorrelationID(correlationId);
  }

  /**
   * Get gatus and custom endpoints indexed by dnpName
   */
  async getAllEndpoints(): Promise<{
    [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[]; isCore: boolean };
  }> {
    return await this.manifest.getAllEndpoints();
  }

  /**
   * Get package endpoints (if exists) properties
   */
  getEndpointsIfExists(dnpName: string, isCore: boolean): NotificationsConfig | null {
    return this.manifest.getEndpointsIfExists(dnpName, isCore);
  }

  /**
   * Joins new endpoints with previous ones
   */
  applyPreviousEndpoints(
    dnpName: string,
    isCore: boolean,
    newNotificationsConfig: NotificationsConfig
  ): NotificationsConfig {
    return this.manifest.applyPreviousEndpoints(dnpName, isCore, newNotificationsConfig);
  }

  /**
   * Update endpoint properties
   */
  async updateEndpoints(dnpName: string, isCore: boolean, notificationsConfig: NotificationsConfig): Promise<void> {
    this.manifest.updateEndpoints(dnpName, isCore, notificationsConfig);
    await this.api.reloadEndpoints();
  }
}

export const notifications = new Notifications();
