import React, { useState } from "react";
// Own module
import { CommunityItem, communityTypes, title } from "../data";
// Components
import Title from "components/Title";
import Card from "components/Card";
import SubTitle from "components/SubTitle";

import "./community.scss";
import { Collapse } from "react-bootstrap";

export default function CommunityHome() {
  const [item, setItem] = useState("Discord");

  function onClick(communityTitle: string) {
    setItem(communityTitle);
  }
  return (
    <>
      <Title title={title} />

      {communityTypes.map((communityItem: CommunityItem) => (
        <Card className="text-center">
          <SubTitle key={communityItem.title}>
            <div
              onClick={() => onClick(communityItem.title)}
              className="card-subtitle"
            >
              {communityItem.title} <communityItem.icon />
            </div>
          </SubTitle>

          <Collapse in={communityItem.title === item}>
            <p className="card-text">{communityItem.text}</p>
          </Collapse>
          <Collapse in={communityItem.title === item}>
            <div className="card-actions">
              {communityItem.actions.map(CommunityItemAction => (
                <CommunityItemAction />
              ))}
            </div>
          </Collapse>
        </Card>
      ))}
    </>
  );
}
