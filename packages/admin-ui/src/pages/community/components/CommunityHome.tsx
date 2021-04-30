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

  function onClick(communitySubtitle: string) {
    setItem(communitySubtitle);
  }
  return (
    <>
      <Title title={title} />

      <Card className="text-center">
        <div className="card-subtitles">
          {communityTypes.map((communityItem: CommunityItem) => (
            <SubTitle key={communityItem.title}>
              <div
                onClick={() => onClick(communityItem.title)}
                className="card-subtitle"
              >
                {communityItem.title} <communityItem.icon />
              </div>
            </SubTitle>
          ))}
        </div>

        <Collapse in={true}>
          <>
            <hr />
            <p className="card-text">
              {
                communityTypes.find(
                  (communityItem: CommunityItem) => communityItem.title === item
                )?.text
              }
            </p>
          </>
        </Collapse>
        <Collapse in={true}>
          <div className="card-actions">
            {communityTypes
              .find(
                (communityItem: CommunityItem) => communityItem.title === item
              )
              ?.actions.map(CommunityItemAction => (
                <CommunityItemAction />
              ))}
          </div>
        </Collapse>
      </Card>
    </>
  );
}
