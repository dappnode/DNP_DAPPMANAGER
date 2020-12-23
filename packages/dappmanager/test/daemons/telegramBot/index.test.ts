import "mocha";
import { expect } from "chai";
import { buildTelegramNotificationMessage } from "../../../src/daemons/telegramBot/buildTelegramNotificationMessage";
import { PackageNotification } from "../../../src/types";

describe("daemons > telegramBot > runWatcher", () => {
  it("Builds telegram message notification in response to a subscription", () => {
    // Example of treshold
    const threshold = {
      id: "dangerous level of 5 GB",
      kb: 5 * 1e6, // ~ 5 GB
      filterCommand: `--filter "name=DAppNodePackage"`,
      containersDescription: "all non-core DNPs"
    };

    //Example of notification
    const formatedNames =
      "DAppNodePackage-hello3\nDAppNodePackage-hello2\nDAppNodePackage-hello";
    const notification: PackageNotification = {
      id: "diskSpaceRanOut-stoppedPackages",
      type: "danger",
      title: `Disk space is running out, ${threshold.id.split(" ")[0]}`,
      body: `Available disk space is less than a ${threshold.id}. To prevent your DAppNode from becoming unusable ${threshold.containersDescription} where stopped (${formatedNames}). Please, free up enough disk space and start them again.`
    };

    const message = buildTelegramNotificationMessage({
      notificationType: notification.type,
      telegramMessage: notification.body
    });

    const result = `*DAppNode *⚠ *danger* ⚠:

Available disk space is less than a dangerous level of 5 GB. To prevent your DAppNode from becoming unusable all non-core DNPs where stopped (DAppNodePackage-hello3
DAppNodePackage-hello2
DAppNodePackage-hello). Please, free up enough disk space and start them again.`;

    expect(message).to.deep.equal(result);
  });
});
