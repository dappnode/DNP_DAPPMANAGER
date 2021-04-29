import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaGithub } from "react-icons/fa";

export default function CommunityGithub() {
  return (
    <Card>
      <CardBootstrap.Header>
        {communityTypes.github.title} <FaGithub />
      </CardBootstrap.Header>
    </Card>
  );
}
