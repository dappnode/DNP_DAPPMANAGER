import React, { useState } from "react";
import { api, useApi } from "api";
import { ReqStatus, HttpsPortalMapping } from "types";
import { MdClose } from "react-icons/md";
import { BsArrowRight } from "react-icons/bs";
import { withToast } from "components/toast/Toast";
import { confirmPromise } from "components/ConfirmDialog";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { shortNameCapitalized as sn } from "utils/format";
import { HttpsPortalNewMapping } from "./HttpsMappingsNew";
import "./https-mapping.scss";

interface Mapping {
  from: string;
  dnpName: string;
  serviceName: string;
  portNumber: number;
}

export function HttpsMappings({
  dnpName,
  serviceName
}: {
  dnpName: string;
  serviceName: string;
}) {
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const mappings = useApi.httpsPortalMappingsGet();

  async function addMapping(mapping: HttpsPortalMapping) {
    if (reqStatus.loading) return;

    try {
      await confirmPromise({
        title: "Exposing service",
        text:
          "Are you sure you want to expose this service to the public internet?",
        label: "Expose",
        variant: "dappnode"
      });

      setReqStatus({ loading: true });
      await withToast(() => api.httpsPortalMappingAdd(mapping), {
        message: "Adding HTTPs mapping...",
        onSuccess: "Added HTTPs mapping"
      });
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e.message });
    } finally {
      mappings.revalidate();
    }
  }

  async function removeMapping(mapping: HttpsPortalMapping) {
    if (reqStatus.loading) return;

    try {
      await confirmPromise({
        title: "Removing HTTPs mapping",
        text: "Are you sure you want to remove this HTTPs mapping?",
        label: "Remove",
        variant: "outline-danger"
      });

      setReqStatus({ loading: true });
      await withToast(() => api.httpsPortalMappingRemove(mapping), {
        message: "Removing HTTPs mapping...",
        onSuccess: "Removed HTTPs mapping"
      });
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e.message });
    } finally {
      mappings.revalidate();
    }
  }

  if (mappings.error) return <ErrorView error={mappings.error} hideIcon red />;
  if (mappings.isValidating) return <Ok loading msg="Loading mappings" />;
  if (!mappings.data) return <ErrorView error={"No data"} hideIcon red />;

  const serviceMappings = mappings.data.filter(
    mapping =>
      mapping.dnpName === dnpName && mapping.serviceName === serviceName
  );

  return (
    <div className="network-mappings">
      {serviceMappings.length > 0 && (
        <div className="list-grid">
          {/* Table header */}
          <header className="name">From</header>
          <header className="name" />
          <header className="name">To</header>
          <header className="header">Remove</header>

          <hr />

          {serviceMappings.map(mapping => (
            <React.Fragment key={mapping.fromSubdomain}>
              <span className="name">{mapping.fromSubdomain}</span>
              <span className="name">
                <BsArrowRight />
              </span>
              <span className="name">
                {sn(mapping.dnpName)} {sn(mapping.serviceName)}
              </span>

              <MdClose onClick={() => removeMapping(mapping)} />
            </React.Fragment>
          ))}
        </div>
      )}

      <HttpsPortalNewMapping
        dnpName={dnpName}
        serviceName={serviceName}
        mappings={mappings.data}
        addMapping={addMapping}
      />
    </div>
  );
}
