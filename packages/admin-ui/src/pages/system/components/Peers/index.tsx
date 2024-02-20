import React from "react";
// Components
import SubTitle from "components/SubTitle";
import AddIpfsPeer from "./AddIpfsPeer";
import ShareIpfsPeer from "./ShareIpfsPeer";
import { docsUrl } from "params";
import LinkDocs from "components/LinkDocs";
import { useLocation } from "react-router-dom";
import { subPaths } from "pages/system/data";

const Peers: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const subPath = path.split("/add-ipfs-peer/")[1];
  const peerFromUrl = subPath ? decodeURIComponent(subPath) : undefined;

  return (
    <>
      <p>
        Learn more about IPFS peers at:{" "}
        <LinkDocs href={docsUrl.ipfsPeersExplanation}>What is IPFS</LinkDocs>
      </p>
      <SubTitle>Share IPFS peer</SubTitle>
      <ShareIpfsPeer matchUrl={"system/" + subPaths.peers} />
      <SubTitle>Add IPFS peer</SubTitle>
      <AddIpfsPeer peerFromUrl={peerFromUrl} />
    </>
  );
};

export default Peers;
