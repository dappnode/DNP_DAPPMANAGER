import React from "react";
import Card from "components/Card";
import ClearCache from "../CacheManager/ClearCacheManager";

export function ClearCacheManager() {
  return (
    <Card spacing>
      <ClearCache />
    </Card>
  );
}
