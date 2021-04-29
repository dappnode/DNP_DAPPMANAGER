import React from "react";
// Own module
import { title } from "../data";
import CommunityDiscord from "./CommunityDiscord";
import CommunityGithub from "./CommunityGithub";
import CommunityDiscourse from "./CommunityDiscourse";
import CommunityTreasury from "./CommunityTreasury";
import CommunityGrants from "./CommunityGrants";
// Components
import Title from "components/Title";
import { Carousel } from "react-bootstrap";

import "./community.scss";

export default function CommunityHome() {
  return (
    <>
      <Title title={title} />
      <Carousel interval={null}>
        <Carousel.Item>
          <CommunityDiscord />
        </Carousel.Item>
        <Carousel.Item>
          <CommunityGithub />
        </Carousel.Item>
        <Carousel.Item>
          <CommunityDiscourse />
        </Carousel.Item>
        <Carousel.Item>
          <CommunityGrants />
        </Carousel.Item>
        <Carousel.Item>
          <CommunityTreasury />
        </Carousel.Item>
      </Carousel>
    </>
  );
}
