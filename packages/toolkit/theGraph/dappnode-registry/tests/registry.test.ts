import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as";
import { Bytes, Address } from "@graphprotocol/graph-ts";
import { NewRepo } from "../generated/schema";
import { NewRepo as NewRepoEvent } from "../generated/Registry/Registry";
import { handleNewRepo } from "../src/registry";
import { createNewRepoEvent } from "./registry-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let id = Bytes.fromI32(1234567890);
    let name = "Example string value";
    let repo = Address.fromString("0x0000000000000000000000000000000000000001");
    let newNewRepoEvent = createNewRepoEvent(id, name, repo);
    handleNewRepo(newNewRepoEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("NewRepo created and stored", () => {
    assert.entityCount("NewRepo", 1);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "NewRepo",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "name",
      "Example string value"
    );
    assert.fieldEquals(
      "NewRepo",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "repo",
      "0x0000000000000000000000000000000000000001"
    );

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  });
});
