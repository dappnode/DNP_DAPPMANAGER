import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Network, networksByType } from "@dappnode/types";
import { RouteType } from "types";
import StakerNetwork from "pages/stakers/components/StakerNetwork";

const isStakerRoute = (r: RouteType) => React.isValidElement(r.element) && r.element.type === StakerNetwork;

const netOf = (r: RouteType): Network | undefined =>
  isStakerRoute(r) ? (r.element as React.ReactElement).props?.network : undefined;

const testSet = new Set(networksByType.testnets);
const mainSet = new Set(networksByType.mainnets);

/**
 * Treats "optimism" as MAINNET (exception).
 * Filters on render based on URL.
 * Navigates to a matching route when toggled.
 */
export function useFilterStakersNetwroks(availableRoutes: RouteType[]) {
  const location = useLocation();
  const navigate = useNavigate();

  const subPath =
    location.pathname
      .split("/")
      .filter(Boolean)
      .pop() || "";

  const currentRoute = availableRoutes.find((r) => r.subPath === subPath);

  const testnetsSelected =
    currentRoute?.subPath === "optimism"
      ? false // Optimism is mainnet (exception)
      : currentRoute && isStakerRoute(currentRoute)
      ? testSet.has(netOf(currentRoute) as Network)
      : false;

  // filter routes for current selection
  const filteredRoutes = React.useMemo(
    () =>
      availableRoutes.filter((r) => {
        if (r.subPath === "prater") return false; // hide prater
        if (r.subPath === "optimism") return !testnetsSelected; // only in mainnets view
        if (!isStakerRoute(r)) return false;
        const net = netOf(r);
        return testnetsSelected ? testSet.has(net as Network) : mainSet.has(net as Network);
      }),
    [availableRoutes, testnetsSelected]
  );

  // toggle -> navigate to first route of the target group if needed
  const handleNetworkFilter = (toTestnets: boolean) => {
    const target = availableRoutes.find((r) => {
      if (r.subPath === "prater") return false;
      if (r.subPath === "optimism") return !toTestnets; // optimism counts only for mainnets
      if (!isStakerRoute(r)) return false;
      const net = netOf(r);
      return toTestnets ? testSet.has(net as Network) : mainSet.has(net as Network);
    })?.subPath;

    if (target && target !== subPath) {
      const base = location.pathname.replace(/\/[^/]*$/, "");
      navigate(`${base}/${target}`);
    }
  };

  return { testnetsSelected, filteredRoutes, handleNetworkFilter };
}
