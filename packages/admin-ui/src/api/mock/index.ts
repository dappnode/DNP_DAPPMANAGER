export { apiAuth } from "./auth";
export { apiRpc } from "./rpc";

// Make sure to crash the UI if mock node is enabled in production

// @ts-ignore
window.mockEnabled = true;
console.warn("Mock mode enabled");
if (window.location.host === "my.dappnode") {
  throw Error("Mock must never be used in production");
}
