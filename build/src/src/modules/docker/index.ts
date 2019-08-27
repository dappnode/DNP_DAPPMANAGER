import docker from "./dockerCommands";
import dockerSafe from "./dockerSafe";

export default {
  ...docker,
  safe: dockerSafe
};
