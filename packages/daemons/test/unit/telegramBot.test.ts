import "mocha";
import { expect } from "chai";
import { formatNotification } from "../../src/telegramBot/formatNotification.js";
import { PackageNotification } from "@dappnode/types";

describe("daemons > telegramBot > formatNotification", () => {
  it("Format notification for Telegram", () => {
    const notification: PackageNotification = {
      id: "sample-notification",
      type: "danger",
      title: "Sample notification title",
      body: `Sample notification body with markdown
- Line 1
- Line 2

Final line`,
    };

    const message = formatNotification(notification);

    const result = `❌ *Sample notification title*

Sample notification body with markdown
- Line 1
- Line 2

Final line`;

    expect(message).to.deep.equal(result);
  });
});
