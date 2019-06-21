const { promisify } = require("util");
const docker = require("docker-remote-api");
const request = docker();

function dockerRequest(method, url) {
  const options = { json: true };
  if (method == "post") options.body = null;

  const dockerRequestPromise = promisify(request[method].bind(request));
  return dockerRequestPromise(url, options);
}

module.exports = dockerRequest;
