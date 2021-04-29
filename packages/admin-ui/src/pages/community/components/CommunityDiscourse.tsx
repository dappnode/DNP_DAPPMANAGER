import React from "react";
import Card from "components/Card";
import { Card as CardBootstrap } from "react-bootstrap";
import { communityTypes } from "../data";
import { FaDiscourse } from "react-icons/fa";
import Button from "components/Button";

export default function CommunityDiscourse() {
  return (
    <Card className="text-center">
      <CardBootstrap.Title>
        {communityTypes.discourse.title} <FaDiscourse />
      </CardBootstrap.Title>
      <CardBootstrap.Body>
        <CardBootstrap.Text>
          Join Discourse forum and ask for support, share your experience,
          contribute to the community and much more.
        </CardBootstrap.Text>
        <Button>Join Discourse</Button>
      </CardBootstrap.Body>
    </Card>
  );
}
