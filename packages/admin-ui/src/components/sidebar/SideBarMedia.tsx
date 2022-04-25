import React from "react";
import { FaDiscord, FaDiscourse, FaGithub, FaTwitter } from "react-icons/fa";

export default function SideBarMedia() {
  return (
    <>
      <a href="https://github.com/dappnode/DAppNodePackage-web3signer-prater">
        <FaGithub />
      </a>
      <a href="https://discord.gg/c28an8dA5k">
        <FaDiscord />
      </a>
      <a href="https://twitter.com/dappnode">
        <FaTwitter />
      </a>
      <a href="https://discourse.dappnode.io/">
        <FaDiscourse />
      </a>
    </>
  );
}
