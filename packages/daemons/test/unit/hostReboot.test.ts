import "mocha";
import { expect } from "chai";
import { Category, Notification, Priority, Status } from "@dappnode/types";
import { getLatestNotificationByCorrelationId } from "../../src/hostReboot/index.js";

function notification({
  id,
  correlationId,
  timestamp,
  status = Status.triggered,
  errors
}: {
  id: number;
  correlationId: string;
  timestamp: number;
  status?: Status;
  errors?: string;
}): Notification {
  return {
    id,
    timestamp,
    title: "Notification",
    body: "Body",
    dnpName: "core.dnp.dappnode.eth",
    category: Category.system,
    priority: Priority.low,
    status,
    isBanner: true,
    isRemote: false,
    seen: false,
    correlationId,
    errors
  };
}

describe("daemons > hostReboot", () => {
  describe("getLatestNotificationByCorrelationId", () => {
    it("returns the newest notification for the correlation id", () => {
      const result = getLatestNotificationByCorrelationId(
        [
          notification({ id: 1, correlationId: "core-reboot-required", timestamp: 100 }),
          notification({ id: 2, correlationId: "other", timestamp: 300 }),
          notification({
            id: 3,
            correlationId: "core-reboot-required",
            timestamp: 200,
            status: Status.resolved
          })
        ],
        "core-reboot-required"
      );

      expect(result?.id).to.equal(3);
    });

    it("ignores notifications with errors", () => {
      const result = getLatestNotificationByCorrelationId(
        [
          notification({ id: 1, correlationId: "core-reboot-required", timestamp: 100 }),
          notification({ id: 2, correlationId: "core-reboot-required", timestamp: 200, errors: "failed" })
        ],
        "core-reboot-required"
      );

      expect(result?.id).to.equal(1);
    });
  });
});
