import React from "react";
import Card from "components/Card";
import { UpdateDockerCompose } from "./UpdateDockerCompose";
import { UpdateDockerEngine } from "./UpdateDockerEngine";

export function DockerManager() {
  return (
    <Card spacing>
      <div className="subtle-header">UPDATE DOCKER ENGINE</div>
      <p>Update docker engine to a stable version with DAppNode.</p>
      <UpdateDockerEngine />

      <hr />

      <div className="subtle-header">UPDATE DOCKER COMPOSE</div>
      <p>
        Update docker compose to a stable version with DAppNode (recommended).
      </p>
      <UpdateDockerCompose />
    </Card>
  );
}
