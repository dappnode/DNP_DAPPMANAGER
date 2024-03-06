import { params } from "@dappnode/params";
import { HttpsPortal, HttpsPortalApiClient } from "./httpsPortal.js";

const httpsPortalApiClient = new HttpsPortalApiClient(
  params.HTTPS_PORTAL_API_URL
);
export const httpsPortal = new HttpsPortal(httpsPortalApiClient);

export { getExposableServices } from "./exposable/index.js";
