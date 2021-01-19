import helmet from "helmet";

// Isolate helmet configuration in a separate file

/**
 * `helmet` package configuration specific for DAppNode served over insecure HTTP
 */
export function helmetConf(): ReturnType<typeof helmet> {
  return helmet({
    // Disable 'Strict-Transport-Security' header since the UI is not served over HTTPS
    hsts: false,

    // TODO: Enabling CSP requires non-trivial changes to our build configuration
    // See: https://webpack.js.org/guides/csp/
    contentSecurityPolicy: false
  });
}
