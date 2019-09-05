import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export default docker;
