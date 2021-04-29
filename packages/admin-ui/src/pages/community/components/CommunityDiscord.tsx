import React from "react";
import Card from "components/Card";
import Button from "components/Button";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaDiscord } from "react-icons/fa";

export default function CommunityDiscord() {
  return (
    <Card className="text-center">
      <CardBootstrap.Title>
        {communityTypes.discord.title} <FaDiscord />
      </CardBootstrap.Title>
      <CardBootstrap.Body>
        <CardBootstrap.Text>
          Join Discord and ask for support, share your experience, contribute to
          the community and much more.
        </CardBootstrap.Text>
        <Button>Join Discord</Button>
      </CardBootstrap.Body>
    </Card>
  );
}
