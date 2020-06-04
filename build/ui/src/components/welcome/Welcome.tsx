import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getNewFeatureIds } from "services/dappnodeStatus/selectors";
import { api } from "api";
// Components
import WelcomeModalContainer from "./WelcomeModalContainer";
import Start from "./Start";
import Finished from "./Finished";
import SystemAutoUpdates from "./features/SystemAutoUpdates";
import ChangeHostPassword from "./features/ChangeHostPassword";
import Repository from "./features/Repository";
import RepositoryFallback from "./features/RepositoryFallback";
// Utils
import { isEqual } from "lodash";
import { NewFeatureId } from "types";
// styles
import "./welcome.scss";

/**
 * This internal Welcome status allows to freeze featureIds
 * featureIds must be frozen during a welcome wizard flow so the user
 * can go back and next without the views changing or disapearing
 */
type Status = "active" | "finished";

interface RouteProps {
  onBack: () => void;
  onNext: () => void;
}

/**
 * Return a view for each routeId
 * RouteIds will be returned by the DAPPMANAGER is a correct order
 */
function getRouteIdComponent(
  routeId: NewFeatureId
): React.FunctionComponent<RouteProps> | undefined {
  switch (routeId) {
    case "system-auto-updates":
      return (props: RouteProps) => <SystemAutoUpdates {...props} />;
    case "change-host-password":
      return (props: RouteProps) => <ChangeHostPassword {...props} />;
    case "repository":
      return (props: RouteProps) => <Repository {...props} />;
    case "repository-fallback":
      return (props: RouteProps) => <RepositoryFallback {...props} />;
    default:
      return undefined;
  }
}

// Assume that on each page you go next by calling the DAPPMANAGER

/**
 * Handles routing and each subroute should have "Next" & "Back"
 */
export default function Welcome() {
  const featureIds = useSelector(getNewFeatureIds);
  const [routeN, setRouteN] = useState(0);
  const [status, setStatus] = useState<Status>("finished");
  // featureIds must be frozen during a welcome wizard flow
  // so the user can go back and next without the views changing
  const [intFeatureIds, setIntFeatureIds] = useState<NewFeatureId[]>([]);

  // Do in two steps to avoid adding routes that don't have a view implemented
  const routes: {
    featureId: NewFeatureId;
    render: React.FunctionComponent<RouteProps>;
  }[] = [];
  for (const featureId of intFeatureIds) {
    const render = getRouteIdComponent(featureId);
    if (render) routes.push({ featureId, render });
  }

  // Append first and last view to make the UX less abrupt
  const routesWithStartFinish = [
    { render: (props: RouteProps) => <Start {...props} /> },
    ...routes,
    { render: (props: RouteProps) => <Finished {...props} /> }
  ];

  // Only modify internal routes when the user is not completing the flow
  // When modifying internal routes, reset route counter and status
  // Make sure the routes have actually changed before restarting the flow
  useEffect(() => {
    if (
      featureIds &&
      featureIds.length > 0 &&
      status !== "active" &&
      !isEqual(intFeatureIds, featureIds)
    ) {
      setStatus("active");
      setRouteN(0);
      setIntFeatureIds(featureIds);
    }
  }, [featureIds, intFeatureIds, status]);

  function onBack() {
    setRouteN(n => (n <= 1 ? 0 : n - 1));
  }

  function onNext(id: NewFeatureId | false) {
    if (routeN === routesWithStartFinish.length - 1) {
      // When clicking next on the last view, mark as finished
      setStatus("finished");
    } else {
      // Move to next route
      setRouteN(n => n + 1);
    }

    // Persist in the DAPPMANAGER that this new feature has been seen by the user
    if (id)
      api.newFeatureStatusSet({ featureId: id, status: "seen" }).catch(e => {
        console.error(`Error on newFeatureStatusSet(${featureId}, seen)`, e);
      });
  }

  const currentRoute = routesWithStartFinish[routeN];
  const featureId = "featureId" in currentRoute && currentRoute.featureId;

  return (
    <WelcomeModalContainer show={routes.length > 0 && status === "active"}>
      {currentRoute &&
        typeof currentRoute.render === "function" &&
        currentRoute.render({ onBack, onNext: () => onNext(featureId) })}
    </WelcomeModalContainer>
  );
}
