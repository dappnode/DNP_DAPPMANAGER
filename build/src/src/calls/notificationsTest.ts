import * as eventBus from "../eventBus";
import * as db from "../db";
import {
  PackageNotification,
  NotificationType,
  RpcHandlerReturn
} from "../types";

/**
 * Adds a notification to be shown the UI.
 * Set the notification param to null (or send none) to generate
 * a random notification
 *
 * @param {(null|Object)} notification: {
 *   id: "notification-id", {string}
 *   type: "danger", {string}
 *   title: "Some notification", {string},
 *   body: "Some text about notification" {string}
 * }
 */
export default async function notificationsTest({
  notification
}: {
  notification?: PackageNotification;
}): Promise<RpcHandlerReturn> {
  if (!notification) {
    notification = {
      id: String(Math.random()).slice(2),
      type: randomType() as NotificationType,
      title: randomSentence(3),
      body: randomSentence(20)
    };
  }

  db.setNotification(notification.id, notification);

  eventBus.notification.emit(notification);

  return {
    message: `Added notification ${JSON.stringify(notification)}`,
    logMessage: true,
    userAction: true
  };
}

// Utils

function randomSentence(numOfWords: number): string {
  const words = [
    "successful",
    "science",
    "unused",
    "things",
    "tumble",
    "embarrassed",
    "pear",
    "obnoxious",
    "belong",
    "feeling",
    "rain",
    "letter",
    "toad",
    "tie",
    "plough",
    "smell",
    "dear",
    "bubble",
    "house",
    "waiting"
  ];
  let sentence = "";
  for (let i = 0; i < numOfWords; i++) {
    sentence += words[Math.floor(Math.random() * words.length)] + " ";
  }
  return sentence;
}

function randomType(): NotificationType {
  const types: NotificationType[] = ["danger", "warning", "success"];
  return types[Math.floor(Math.random() * types.length)];
}
