import { useEffect, useState } from "react";
import { api } from "api";
import { pathName, subPaths } from "pages/system/data";

export const usePwaSubtabUrl = (): string | undefined => {
  const [pwaSubtabUrl, setPwaSubtabUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchPwaUrl() {
      const url = await api.pwaUrlGet();
      if (url) {
        setPwaSubtabUrl(`https://${url}/${pathName}/${subPaths.app}`);
      } else {
        setPwaSubtabUrl(undefined);
      }
    }
    fetchPwaUrl();
  }, []);

  return pwaSubtabUrl;
};
