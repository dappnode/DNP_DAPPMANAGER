import React from "react";
import Card from "components/Card";
import { DockerEngineManager } from "./DockerEngine";
import { DockerComposeManager } from "./DockerCompose";

export function DockerManager() {
  return (
    <Card spacing>
      <DockerEngineManager />
      <hr />
      <DockerComposeManager />
    </Card>
  );
}
