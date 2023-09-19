import { mapValues } from "lodash-es";
import sinon from "sinon";
import { eventBus, EventBus } from "@dappnode/eventbus";

export function getMockEventBus(): {
  [K in keyof EventBus]: { emit: sinon.SinonStub; on: sinon.SinonStub };
} {
  return mapValues(eventBus, () => ({ emit: sinon.stub(), on: sinon.stub() }));
}
