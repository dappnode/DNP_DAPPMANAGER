import { promisify } from "util";
const docker = require("docker-remote-api");
const request = docker();

function dockerRequest(method: string, url: string) {
  const options: { json: boolean; body?: null } = { json: true };
  if (method == "post") options.body = null;

  const dockerRequestPromise = promisify(request[method].bind(request));
  return dockerRequestPromise(url, options);
}

export default dockerRequest;
