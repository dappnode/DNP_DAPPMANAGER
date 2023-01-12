import { mapValues } from "lodash-es";
import sinon from "sinon";
import { eventBus, EventBus } from "../../../src/eventBus";

export function getMockEventBus(): {
  [K in keyof EventBus]: { emit: sinon.SinonStub; on: sinon.SinonStub };
} {
  return mapValues(eventBus, () => ({ emit: sinon.stub(), on: sinon.stub() }));
}
