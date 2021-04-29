import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaDollarSign } from "react-icons/fa";
import Button from "components/Button";

export default function CommunityGrants() {
  return (
    <Card className="text-center">
      <CardBootstrap.Title>
        {communityTypes.grants.title} <FaDollarSign />
      </CardBootstrap.Title>
      <CardBootstrap.Body>
        <CardBootstrap.Text>
          Contribute to DAppNode and get rewards back
        </CardBootstrap.Text>
        <Button>Contribute</Button>
      </CardBootstrap.Body>
    </Card>
  );
}
