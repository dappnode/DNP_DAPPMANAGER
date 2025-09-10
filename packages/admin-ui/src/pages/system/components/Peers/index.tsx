import React from "react";
import SubTitle from "components/SubTitle";
import AddIpfsPeer from "./AddIpfsPeer";
import ShareIpfsPeer from "./ShareIpfsPeer";
import { docsUrl } from "params";
import LinkDocs from "components/LinkDocs";
import { pathName, subPaths } from "pages/system/data";

const Peers: React.FC = () => {
  return (
    <>
      <p>
        Learn more about IPFS peers at: <LinkDocs href={docsUrl.ipfsPeersExplanation}>What is IPFS</LinkDocs>
      </p>
      <SubTitle>Share IPFS peer</SubTitle>
      <ShareIpfsPeer matchUrl={`${pathName}/${subPaths.ipfs}`} />
      <SubTitle>Add IPFS peer</SubTitle>
      <AddIpfsPeer />
    </>
  );
};

export default Peers;
