import React from "react";
import Card from "components/Card";
import { UpdateDockerEngine } from "./DockerEngine";
import { UpdateDockerCompose } from "./DockerCompose";

export function DockerUpdate() {
  return (
    <Card spacing>
      <UpdateDockerCompose />
      <hr />
      <UpdateDockerEngine />
    </Card>
  );
}
