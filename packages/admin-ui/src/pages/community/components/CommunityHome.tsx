import React from "react";
// Own module
import { CommunityItem, communityTypes, title } from "../data";
// Components
import Title from "components/Title";
import Card from "components/Card";
import SubTitle from "components/SubTitle";

import "./community.scss";

export default function CommunityHome() {
  return (
    <>
      <Title title={title} />

      <Card>
        {communityTypes.map((communityItem: CommunityItem) => (
          <Card className="text-center">
            <SubTitle key={communityItem.title}>
              {communityItem.title} <communityItem.icon />
            </SubTitle>
            <p>{communityItem.text}</p>
            <div className="community-actions">
              {communityItem.actions.map((CommunityItemAction) => (
                <CommunityItemAction />
              ))}
            </div>
          </Card>
        ))}
      </Card>
    </>
  );
}
