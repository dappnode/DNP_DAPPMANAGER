const { eventBus, eventBusTag } = require("eventBus");

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

const notificationsTest = async ({ notification }) => {
  if (!notification) {
    const id = String(Math.random()).slice(2);
    notification = {
      id,
      type: randomType(),
      title: randomSentence(3),
      body: randomSentence(20)
    };
  }
  eventBus.emit(eventBusTag.pushNotification, notification);

  return {
    message: `Added notification ${JSON.stringify(notification)}`,
    logMessage: true,
    userAction: true
  };
};

// Utils

function randomSentence(numOfWords) {
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

function randomType() {
  const types = ["danger", "warning", "success"];
  return types[Math.floor(Math.random() * types.length)];
}

module.exports = notificationsTest;
