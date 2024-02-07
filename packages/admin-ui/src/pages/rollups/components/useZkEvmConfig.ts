import { useState, useEffect } from "react";
import { ReqStatus } from "types";
import { ZkEvmItem } from "@dappnode/common";
import { responseInterface } from "swr";

export const useZkEvmConfig = (
  currentZkEvmConfigReq: responseInterface<ZkEvmItem[], Error>
) => {
  // Request status
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  // Flag indicating whether zkEVM is installed
  const [isZkEvmInstalled, setIsZkEvmInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (currentZkEvmConfigReq.data) {
      const installedZkEvmItem = currentZkEvmConfigReq.data.find(
        item => item.isInstalled
      );
      setIsZkEvmInstalled(!!installedZkEvmItem);
    }
  }, [currentZkEvmConfigReq.data]);

  return {
    reqStatus,
    setReqStatus,
    isZkEvmInstalled
  };
};
