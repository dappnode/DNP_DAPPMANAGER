import React from "react";
import Card from "components/Card";
import { UpdateDockerEngine } from "./DockerEngine";
import { UpdateDockerCompose } from "./DockerCompose";

export function DockerManager() {
  return (
    <Card spacing>
      <UpdateDockerCompose />
      <hr />
      <UpdateDockerEngine />
    </Card>
  );
}
