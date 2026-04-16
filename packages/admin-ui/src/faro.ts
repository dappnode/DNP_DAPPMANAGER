import { createRoutesFromChildren, matchRoutes, Routes, useLocation, useNavigationType } from "react-router-dom";
import {
  createReactRouterV6Options,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration
} from "@grafana/faro-react";
import { getDefaultOTELInstrumentations, TracingInstrumentation } from "@grafana/faro-web-tracing";
import { FetchTransport } from "@grafana/faro-web-sdk";
import type { Faro } from "@grafana/faro-react";

let faroInstance: Faro | null = null;

// Grafana Cloud Faro collector proxy endpoint
const GRAFANA_PROXY_URL = "http://37.27.134.118:8080";

// Required upstream proxy auth header/value
const PROXY_AUTH_HEADER = "X-Dappnode";
const PROXY_AUTH_VALUE = "dappnode-ui-metrics";

/**
 * Initialize Faro and immediately pause it.
 * Faro must be initialized early for <FaroRoutes> to work,
 * but no data is sent until consent is confirmed via unpauseFaro().
 */
export function initFaro(): void {
  const metricsUrlPattern = new RegExp(`^${GRAFANA_PROXY_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

  faroInstance = initializeFaro({
    url: GRAFANA_PROXY_URL,
    app: {
      name: "dappnode",
      version: "1.0.0",
      environment: "production"
    },
    transports: [
      new FetchTransport({
        url: GRAFANA_PROXY_URL,
        requestOptions: {
          headers: {
            [PROXY_AUTH_HEADER]: PROXY_AUTH_VALUE
          }
        }
      })
    ],
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
