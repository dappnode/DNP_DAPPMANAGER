import { notifications } from "@dappnode/notifications";
import {
  CustomEndpoint,
  GatusEndpoint,
  InstalledPackageData,
  Notification,
  NotificationPayload,
  NotificationsConfig,
  NotifierSubscription
} from "@dappnode/types";

/**
 * Sends custom notification to notifier service
 */
export async function notificationsSendCustom({
  notificationPayload,
  subscriptionEndpoint
}: {
  notificationPayload: NotificationPayload;
  subscriptionEndpoint?: string;
}): Promise<void> {
  return await notifications.sendNotification(notificationPayload, subscriptionEndpoint);
}

/**
 * Get all the notifications
 * @returns all the notifications
 */
export async function notificationsGetAll(): Promise<Notification[]> {
  return await notifications.getAllNotifications();
}

/**
 * Get all the notifications
 * @returns all the notifications
 */
export async function notificationsGetBanner({ timestamp }: { timestamp: number }): Promise<Notification[]> {
  const { isNotifierRunning } = await notifications.notificationsPackageStatus();
  return isNotifierRunning ? await notifications.getBannerNotifications(timestamp) : [];
}

/**
 * Get unseen notifications count
 */
export async function notificationsGetUnseenCount(): Promise<number> {
  const { isNotifierRunning } = await notifications.notificationsPackageStatus();
  return isNotifierRunning ? await notifications.getUnseenNotificationsCount() : 0;
}

/**
 * Set all non-banner notifications as seen
 */
export async function notificationsSetAllSeen(): Promise<void> {
  return await notifications.setAllNotificationsSeen();
}

/**
 * Set a notification as seen by providing its correlationId
 */
export async function notificationSetSeenByCorrelationID({ correlationId }: { correlationId: string }): Promise<void> {
  return await notifications.setNotificationSeenByCorrelationID(correlationId);
}

/**
 * Get gatus and custom endpoints indexed by dnpName
 */
export async function notificationsGetAllEndpoints(): Promise<{
  [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[]; isCore: boolean };
}> {
  return await notifications.getAllEndpoints();
}

/**
 * Update endpoint properties
 */
export async function notificationsUpdateEndpoints({
  dnpName,
  isCore,
  notificationsConfig
}: {
  dnpName: string;
  isCore: boolean;
  notificationsConfig: NotificationsConfig;
}): Promise<void> {
  await notifications.updateEndpoints(dnpName, isCore, notificationsConfig);
}

/**
 * Joins new endpoints with previous ones
 */
export async function notificationsApplyPreviousEndpoints({
  dnpName,
  isCore,
  newNotificationsConfig
}: {
  dnpName: string;
  isCore: boolean;
  newNotificationsConfig: NotificationsConfig;
}): Promise<NotificationsConfig> {
  return await notifications.applyPreviousEndpoints(dnpName, isCore, newNotificationsConfig);
}

/**
 * Retrieve notifications pkg status
 */
export async function notificationsPackageStatus(): Promise<{
  notificationsDnp: InstalledPackageData | null;
  isInstalled: boolean;
  isRunning: boolean;
  servicesNotRunning: string[];
  isNotifierRunning: boolean;
}> {
  return await notifications.notificationsPackageStatus();
}

/**
 * Get vapid key from notifier API
 */
export async function notificationsGetVapidKey(): Promise<string | null> {
  return await notifications.getVapidKey();
}

/**
 * Retrieves all subs from notifier
 */
export async function notificationsGetSubscriptions(): Promise<NotifierSubscription[] | null> {
  return await notifications.fetchSubscriptions();
}

/**
 * Updates a subscription alias from notifier by its endpoint
 */
export async function notificationsUpdateSubAlias({
  endpoint,
  alias
}: {
  endpoint: string;
  alias: string;
}): Promise<void> {
  return await notifications.updateSubscriptionAlias(endpoint, alias);
}

/**
 * Deletes a subscription from notifier by its endpoint
 */
export async function notificationsDeleteSubscription({ endpoint }: { endpoint: string }): Promise<void> {
  return await notifications.deleteSubscription(endpoint);
}

/**
 * Posts a new subscription to notifier
 */
export async function notificationsPostSubscription({
  subscription
}: {
  subscription: NotifierSubscription;
}): Promise<void> {
  return await notifications.postSubscription(subscription);
}

/**
 * Sends a test notification to all subscriptions / specific subscription
 */
export async function notificationsSendSubTest({ endpoint }: { endpoint?: string }): Promise<void> {
  return await notifications.sendSubTestNotification(endpoint);
}
