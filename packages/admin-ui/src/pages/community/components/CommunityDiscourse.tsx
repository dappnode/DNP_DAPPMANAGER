import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaDiscourse } from "react-icons/fa";

export default function CommunityDiscourse() {
  return (
    <Card>
      <CardBootstrap.Header>
        {communityTypes.discourse.title} <FaDiscourse />
      </CardBootstrap.Header>
    </Card>
  );
}
