import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaDiscord } from "react-icons/fa";

export default function CommunityDiscord() {
  return (
    <Card>
      <CardBootstrap.Header>
        {communityTypes.discord.title} <FaDiscord />
      </CardBootstrap.Header>
    </Card>
  );
}
