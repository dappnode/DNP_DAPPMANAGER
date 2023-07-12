import React from "react";
// Components
import SubTitle from "components/SubTitle";
import AddIpfsPeer from "./AddIpfsPeer";
import ShareIpfsPeer from "./ShareIpfsPeer";
import { docsUrl } from "params";
import LinkDocs from "components/LinkDocs";
import { useLocation } from "react-router-dom";

const Peers: React.FC = () => {
  const location = useLocation();
  const peerPath = location.pathname.split("/").pop();
  const peerFromUrl = decodeURIComponent(peerPath || "");

  return (
    <>
      <p>
        Learn more about IPFS peers at:{" "}
        <LinkDocs href={docsUrl.ipfsPeersExplanation}>What is IPFS</LinkDocs>
      </p>
      <SubTitle>Share IPFS peer</SubTitle>
      <ShareIpfsPeer matchUrl={"/"} />
      <SubTitle>Add IPFS peer</SubTitle>
      <AddIpfsPeer peerFromUrl={peerFromUrl} />
    </>
  );
}

export default Peers;
