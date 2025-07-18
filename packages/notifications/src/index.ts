import { NotificationsApi } from "./api.js";
import { NotificationsManifest } from "./manifest.js";
import {
  CustomEndpoint,
  GatusEndpoint,
  InstalledPackageData,
  Notification,
  NotificationPayload,
  NotificationsConfig,
  NotifierSubscription
} from "@dappnode/types";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";

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
  async sendNotification(notificationPayload: NotificationPayload, subscriptionEndpoint?: string): Promise<void> {
    const { isNotifierRunning } = await this.notificationsPackageStatus();

    // Only send custom notifications if the notifier service is running
    if (isNotifierRunning) {
      await this.api.sendNotification(notificationPayload, subscriptionEndpoint);
    }
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
  async setNotificationSeenByCorrelationID(correlationId: string): Promise<void> {
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

  /**
   * Update endpoints only API
   */
  async updateEndpointsApi(): Promise<void> {
    await this.api.reloadEndpoints();
  }

  /**
   * Determine if notifications package is installed
   */
  async notificationsPackageStatus(): Promise<{
    notificationsDnp: InstalledPackageData | null;
    isInstalled: boolean;
    isRunning: boolean;
    isNotifierRunning: boolean;
    servicesNotRunning: string[];
  }> {
    const notificationsDnp = await listPackageNoThrow({ dnpName: params.notificationsDnpName });
    const isInstalled = Boolean(notificationsDnp);
    const servicesNotRunning =
      notificationsDnp?.containers.filter((c) => c.state !== "running").map((c) => c.serviceName) || [];
    const isRunning = isInstalled && servicesNotRunning.length === 0; // Considering running if all services are running
    const isNotifierRunning = isInstalled && !servicesNotRunning.includes("notifier");
    return { notificationsDnp, isInstalled, isRunning, servicesNotRunning, isNotifierRunning };
  }

  /**
   * Retrieves vapidKey from notifier
   */
  async getVapidKey(): Promise<string | null> {
    return await this.api.getVapidKey();
  }

  /**
   * Retrieves all subs from notifier
   */
  async fetchSubscriptions(): Promise<NotifierSubscription[] | null> {
    return await this.api.fetchSubscriptions();
  }

  /**
   * Updates a subscription alias from notifier by its endpoint
   */
  async updateSubscriptionAlias(endpoint: string, alias: string): Promise<void> {
    return await this.api.updateSubscriptionAlias(endpoint, alias);
  }

  /**
   * Deletes a subscription from notifier by its endpoint
   */
  async deleteSubscription(endpoint: string): Promise<void> {
    return await this.api.deleteSubscription(endpoint);
  }

  /**
   * Posts a new subscription to notifier
   */
  async postSubscription(subscription: NotifierSubscription): Promise<void> {
    return await this.api.postSubscription(subscription);
  }

  /**
   * Sends a test notification to all subscriptions / specific subscription
   */
  async sendSubTestNotification(endpoint?: string): Promise<void> {
    return await this.api.sendSubTestNotification(endpoint);
  }
}

export const notifications = new Notifications();
