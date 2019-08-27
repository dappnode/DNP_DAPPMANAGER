const Docker = require("dockerode");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export default docker;
