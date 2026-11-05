import React from "react";
import AddIpfsPeer from "./AddIpfsPeer";
import ShareIpfsPeer from "./ShareIpfsPeer";
import { pathName, subPaths } from "pages/system/data";
import { docsUrl } from "params";
import LinkDocs from "components/LinkDocs";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import "./peers.scss";

const Peers: React.FC = () => {
  return (
    <div>
      <SubTitle>Peers</SubTitle>
      <Card>
        <div className="peers-container">
          <ShareIpfsPeer matchUrl={`${pathName}/${subPaths.ipfs}`} />
          <div className="divider" />
          <AddIpfsPeer />
          <div>
            Learn more about IPFS peers at: <LinkDocs href={docsUrl.ipfs}>What is IPFS</LinkDocs>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Peers;
