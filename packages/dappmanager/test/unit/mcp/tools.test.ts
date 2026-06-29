import { expect } from "chai";
import { dispatchTool, getOpenAITools } from "../../../src/mcp/dispatch.js";
import { dappnodeTools } from "../../../src/mcp/tools.js";

const addedTools = [
  { name: "dappnode_list_volumes", mutating: false },
  { name: "dappnode_remove_orphan_volume", mutating: true },
  { name: "dappnode_remove_package", mutating: true },
  { name: "dappnode_remove_package_volume", mutating: true },
  { name: "dappnode_get_ports_status", mutating: false },
  { name: "dappnode_get_user_action_logs", mutating: false },
  { name: "dappnode_get_node_status", mutating: false }
];

describe("mcp / tools", () => {
  it("registers volume, package removal, port, action log, and node status tools", () => {
    for (const expectedTool of addedTools) {
      const tool = dappnodeTools[expectedTool.name];

      expect(tool, expectedTool.name).to.not.equal(undefined);
      expect(Boolean(tool.mutating), expectedTool.name).to.equal(expectedTool.mutating);
    }
  });

  it("exports the added tools in the OpenAI tool schema", () => {
    const toolsByName = new Map(getOpenAITools().map((tool) => [tool.function.name, tool]));

    for (const expectedTool of addedTools) {
      expect(toolsByName.has(expectedTool.name), expectedTool.name).to.equal(true);
    }

    expect(requiredParams("dappnode_remove_package")).to.deep.equal(["dnpName"]);
    expect(requiredParams("dappnode_remove_package_volume")).to.deep.equal(["dnpName"]);
    expect(requiredParams("dappnode_remove_orphan_volume")).to.deep.equal(["name"]);

    const packageVolumeProperties = properties("dappnode_remove_package_volume");
    expect(packageVolumeProperties).to.have.property("volumeId");

    const nodeStatusProperties = properties("dappnode_get_node_status");
    expect(nodeStatusProperties).to.have.property("networks");
  });

  it("rejects invalid destructive tool arguments before execution", async () => {
    const packageVolumeResult = await dispatchTool("dappnode_remove_package_volume", {
      volumeId: "mockdnpdappnodeeth_data"
    });
    expect(packageVolumeResult.ok).to.equal(false);
    expect(packageVolumeResult.mutating).to.equal(true);
    expect(packageVolumeResult.error).to.include("dnpName");

    const packageResult = await dispatchTool("dappnode_remove_package", { deleteVolumes: true });
    expect(packageResult.ok).to.equal(false);
    expect(packageResult.mutating).to.equal(true);
    expect(packageResult.error).to.include("dnpName");

    const orphanVolumeResult = await dispatchTool("dappnode_remove_orphan_volume", {});
    expect(orphanVolumeResult.ok).to.equal(false);
    expect(orphanVolumeResult.mutating).to.equal(true);
    expect(orphanVolumeResult.error).to.include("name");
  });

  it("rejects unsupported dashboard networks before execution", async () => {
    const result = await dispatchTool("dappnode_get_node_status", { networks: ["holesky"] });

    expect(result.ok).to.equal(false);
    expect(result.error).to.include("Invalid enum value");
  });
});

function parameters(toolName: string): { properties?: Record<string, unknown>; required?: string[] } {
  const tool = getOpenAITools().find((openAiTool) => openAiTool.function.name === toolName);
  expect(tool, toolName).to.not.equal(undefined);
  return tool?.function.parameters as { properties?: Record<string, unknown>; required?: string[] };
}

function requiredParams(toolName: string): string[] | undefined {
  return parameters(toolName).required;
}

function properties(toolName: string): Record<string, unknown> | undefined {
  return parameters(toolName).properties;
}
