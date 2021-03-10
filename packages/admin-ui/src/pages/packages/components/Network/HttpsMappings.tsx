import React, { useState, useEffect } from "react";
import { api, useApi } from "api";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { rootPath as installedRootPath } from "pages/installer";
import Alert from "react-bootstrap/esm/Alert";
import { MdAdd } from "react-icons/md";
import { MdClose } from "react-icons/md";
import { BsArrowRight } from "react-icons/bs";
import { withToast } from "components/toast/Toast";
import { confirmPromise } from "components/ConfirmDialog";
import { InputForm } from "components/InputForm";
import Button from "components/Button";
import Switch from "components/Switch";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { getPublicSubdomain } from "utils/domains";
import { shortNameCapitalized as sn } from "utils/format";
import newTabProps from "utils/newTabProps";
import { ReqStatus, HttpsPortalMapping } from "types";
import { httpsPortalDnpName } from "params";
import "./https-mapping.scss";
import { urlJoin } from "utils/url";

export function HttpsMappings({
  dnpName,
  serviceName
}: {
  dnpName: string;
  serviceName: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState("");
  const [port, setPort] = useState("80");

  const mappings = useApi.httpsPortalMappingsGet();
  const dnpsRequest = useApi.packagesGet();
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);

  // Prefill the `from` input with the recommended subdomain on every select change
  useEffect(() => {
    setFrom(getPublicSubdomain({ dnpName, serviceName }));
  }, [dnpName, serviceName]);

  /** Add the new mapping created in the local editor */
  async function addMapping() {
    if (reqStatus.loading) return;

    const mapping: HttpsPortalMapping = {
      fromSubdomain: from,
      dnpName,
      serviceName,
      port: parseInt(port)
    };

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

      // Clear editor
      setFrom("");
      setEditing(false);
    } catch (e) {
      setReqStatus({ error: e.message });
    } finally {
      mappings.revalidate();
    }
  }

  /** Remove any mapping, could be external to this service */
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

  // Helper UI in case the HTTPs Portal is bad
  if (dnpsRequest.data) {
    const httpsPortalDnp = dnpsRequest.data.find(
      dnp => dnp.dnpName === httpsPortalDnpName
    );
    if (!httpsPortalDnp) {
      const url = urlJoin(installedRootPath, httpsPortalDnpName);
      return (
        <Alert variant="secondary">
          You must <NavLink to={url}>install the HTTPs Portal</NavLink> to use
          this feature
        </Alert>
      );
    }
  }

  const serviceMappings = mappings.data.filter(
    mapping =>
      showAll ||
      (mapping.dnpName === dnpName && mapping.serviceName === serviceName)
  );

  // New mapping validation
  const fromError = validateFromSubdomain(from, mappings.data);
  const portError = validatePort(port);
  const isValid = !fromError && !portError;

  return (
    <div className="network-mappings">
      <div className="list-grid">
        {/* Table header */}
        <header className="name">FROM</header>
        <header className="name" />
        <header className="name">TO</header>
        <header className="header">REMOVE</header>

        <hr />

        {serviceMappings.length === 0 && (
          <span className="no-mappings">No mappings</span>
        )}

        {serviceMappings.map(mapping => (
          <React.Fragment key={mapping.fromSubdomain}>
            <span className="name">
              <a
                href={`https://${mapping.fromSubdomain}.${dappnodeIdentity.domain}`}
                {...newTabProps}
              >
                {mapping.fromSubdomain}
              </a>
            </span>
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

      {editing && (
        <InputForm
          fields={[
            {
              label: "From subdomain",
              labelId: "from-subdomain",
              value: from,
              onValueChange: setFrom,
              error: fromError
            },
            {
              label: "To port",
              labelId: "to-port",
              type: "number",
              value: port,
              onValueChange: setPort,
              error: portError
            }
          ]}
        >
          <Button
            type="submit"
            variant="dappnode"
            onClick={addMapping}
            disabled={!isValid || reqStatus.loading}
          >
            Add mapping
          </Button>
        </InputForm>
      )}

      <div className="bottom-buttons">
        <Switch
          className="show-all"
          checked={showAll}
          onToggle={setShowAll}
          label="Show all"
        />

        {editing ? (
          <Button onClick={() => setEditing(false)}>Cancel</Button>
        ) : (
          <Button
            className="new-mapping-button"
            variant="dappnode"
            onClick={() => setEditing(true)}
          >
            New mapping <MdAdd />
          </Button>
        )}
      </div>
    </div>
  );
}

function validateFromSubdomain(
  from: string,
  mappings: HttpsPortalMapping[]
): string | null {
  if (!from) {
    return "from subdomain is empty";
  }

  const dupMapping = mappings.find(m => m.fromSubdomain === from);
  if (dupMapping) {
    const target = `${sn(dupMapping.dnpName)} ${sn(dupMapping.serviceName)}`;
    return `subdomain is already used to map to ${target}`;
  }

  return null;
}

function validatePort(port: string): string | null {
  if (!port) return "Invalid empty port";
  const portNum = parseInt(port);
  if (!portNum) return "Invalid port number";
  if (portNum > 65535) return "Port number too high";
  return null;
}
