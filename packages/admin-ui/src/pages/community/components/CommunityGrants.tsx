import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaDollarSign } from "react-icons/fa";

export default function CommunityGrants() {
  return (
    <Card>
      <CardBootstrap.Header>
        {communityTypes.grants.title} <FaDollarSign />
      </CardBootstrap.Header>
    </Card>
  );
}
