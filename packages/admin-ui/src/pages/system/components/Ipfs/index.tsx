import React from "react";
import IpfsNode from "./IpfsNode";
import Peers from "./Peers";

const Ipfs: React.FC = () => {
  return (
    <>
      <IpfsNode />
      <Peers />
    </>
  );
};

export default Ipfs;
