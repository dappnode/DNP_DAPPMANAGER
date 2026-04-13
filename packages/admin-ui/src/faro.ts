import { createRoutesFromChildren, matchRoutes, Routes, useLocation, useNavigationType } from "react-router-dom";
import {
  createReactRouterV6Options,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration
} from "@grafana/faro-react";
import { getDefaultOTELInstrumentations, TracingInstrumentation } from "@grafana/faro-web-tracing";
import type { Faro } from "@grafana/faro-react";

let faroInstance: Faro | null = null;

// Build metrics URL based on current browser location
const getMetricsBaseUrl = () => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}:8080`;
};

/**
 * Initialize Faro and immediately pause it.
 * Faro must be initialized early for <FaroRoutes> to work,
 * but no data is sent until consent is confirmed via unpauseFaro().
 */
export function initFaro(): void {
  const metricsBaseUrl = getMetricsBaseUrl();
  const metricsUrlPattern = new RegExp(`^${metricsBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

  faroInstance = initializeFaro({
    url: metricsBaseUrl,
    app: {
      name: "dappnode",
      version: "1.0.0",
      environment: "production"
    },
    sessionTracking: {
      samplingRate: 1,
      persistent: true
    },
    instrumentations: [
      ...getWebInstrumentations({}),
      new TracingInstrumentation({
        instrumentations: [...getDefaultOTELInstrumentations({ ignoreUrls: [metricsUrlPattern] })]
      }),
      new ReactIntegration({
        router: createReactRouterV6Options({
          createRoutesFromChildren,
          matchRoutes,
          Routes,
          useLocation,
          useNavigationType
        })
      })
    ]
  });

  // Start paused — no data sent until user consent is confirmed from DB
  faroInstance.pause();
}

export function pauseFaro(): void {
  faroInstance?.pause();
}

export function unpauseFaro(): void {
  faroInstance?.unpause();
}
