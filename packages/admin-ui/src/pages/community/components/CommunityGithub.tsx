import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaGithub } from "react-icons/fa";
import Button from "components/Button";

export default function CommunityGithub() {
  return (
    <Card className="text-center">
      <CardBootstrap.Title>
        {communityTypes.github.title} <FaGithub />
      </CardBootstrap.Title>
      <CardBootstrap.Body>
        <CardBootstrap.Text>
          Go to Github and report any issue or feature you may have. Also
          contribute to dappnode by doing DAppNode packages using the SDK
        </CardBootstrap.Text>
        <Button>Join Github</Button>
      </CardBootstrap.Body>
    </Card>
  );
}
