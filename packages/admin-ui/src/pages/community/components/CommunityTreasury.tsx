import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaCodepen } from "react-icons/fa";

export default function CommunityTreasury() {
  return (
    <Card className="text-center">
      <CardBootstrap.Title>
        {communityTypes.treasury.title} <FaCodepen />
      </CardBootstrap.Title>
      <CardBootstrap.Body>
        <CardBootstrap.Text>
          As an open source project, community contribution is our most added
          value. Contribute to DAppNode by asking questions, answering
          questions, developing DAppNode packages, reporting issues and anything
          you may think it is useful.You will be rewarded for contributing on
          any of the platforms
        </CardBootstrap.Text>
      </CardBootstrap.Body>
    </Card>
  );
}
