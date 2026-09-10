import React from "react";
import IpfsNode from "./IpfsNode";
import Peers from "./Peers";
import { useApi } from "api";
import { ipfsDnpName } from "params";

const Ipfs: React.FC = () => {
  const dnpRequest = useApi.packageGet({ dnpName: ipfsDnpName });
  const dnp = dnpRequest.data;
  const isIpfsInstalled = Boolean(dnp);

  return (
    <>
      <IpfsNode isIpfsInstalled={isIpfsInstalled} onIpfsInstalled={dnpRequest.revalidate} />
      {isIpfsInstalled ? <Peers /> : null}
    </>
  );
};

export default Ipfs;
