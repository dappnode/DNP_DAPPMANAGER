import React from "react";
import { Alert } from "react-bootstrap";
import { adminUiLocalDomain } from "params";

export function LocalProxyBanner() {
  return (
    window.location.origin === adminUiLocalDomain && (
      <Alert variant="danger">
        <Alert.Heading>Local Proxy Connection</Alert.Heading>
        <div>
          Local proxy is less reliable and only gives access to the Dappmanager UI. It won't load other Dappnode
          services. Use it <b>only as a fallback</b> method.
        </div>
      </Alert>
    )
  );
}
