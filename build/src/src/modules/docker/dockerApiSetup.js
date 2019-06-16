//asdasdasd
const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

module.exports = docker;
