import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaCodepen } from "react-icons/fa";

export default function CommunityTreasury() {
  return (
    <Card>
      <CardBootstrap.Header>
        {communityTypes.treasury.title} <FaCodepen />
      </CardBootstrap.Header>
    </Card>
  );
}
