"use strict";
const { Docker } = require("node-docker-api");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

/* eslint-disable no-console */
/**
 * [WIP]
 * ##### DEV ##### TODO
 */

function createLogStream(id) {
  docker.container
    .list()
    .then(containers => containers.find(c => c.data.Image.includes(id)))
    .then(container =>
      container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: 1
      })
    )
    .then(stream => {
      stream.on("data", info => console.log(info.toString("utf8")));
      stream.on("error", err => console.log("Error", err));
      stream.on("close", err => console.log("Close", err));
      setTimeout(() => {
        console.log("Closing the stream");
        stream.destroy("Because I can");
      }, 5000);
    })
    .catch(error => console.log(error));
}

createLogStream("random-logger");
