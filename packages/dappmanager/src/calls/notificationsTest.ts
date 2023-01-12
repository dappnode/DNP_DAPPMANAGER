import { eventBus } from "../eventBus";
import { PackageNotification, NotificationType } from "@dappnode/common";
/**
 * Adds a notification to be shown the UI.
 * Set the notification param to null (or send none) to generate
 * a random notification
 *
 * @param notification: {
 *   id: "notification-id", {string}
 *   type: "danger", {string}
 *   title: "Some notification", {string},
 *   body: "Some text about notification" {string}
 * }
 */
export async function notificationsTest({
  notification
}: {
  notification?: PackageNotification;
}): Promise<void> {
  if (!notification) {
    notification = {
      id: String(Math.random()).slice(2),
      type: randomType(),
      title: randomSentence(3),
      body: randomSentence(20)
    };
  }

  eventBus.notification.emit(notification);
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
  const types: NotificationType[] = ["danger", "warning", "success", "info"];
  return types[Math.floor(Math.random() * types.length)];
}
