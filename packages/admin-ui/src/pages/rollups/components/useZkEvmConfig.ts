import { useState, useEffect } from "react";
import { ZKEVMItem } from "../../../../../types/src/rollups";
import { ReqStatus } from "types";
import { responseInterface } from "swr";

export const useZkEvmConfig = (
  currentZkEvmConfigReq: responseInterface<ZKEVMItem<"rollup">[], Error>
) => {
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const [isZkEvmInstalled, setIsZkEvmInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (currentZkEvmConfigReq.data) {
      const installedZkEvmItem = currentZkEvmConfigReq.data.find(
        item => item.status === "ok" && item.isInstalled
      );

      if (installedZkEvmItem) {
        setIsZkEvmInstalled(true);
      } else {
        setIsZkEvmInstalled(false);
      }
    }
  }, [currentZkEvmConfigReq.data]);

  return {
    reqStatus,
    setReqStatus,
    isZkEvmInstalled
  };
};