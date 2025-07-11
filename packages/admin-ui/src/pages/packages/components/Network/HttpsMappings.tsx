import React, { useEffect, useState } from "react";
import { api, useApi } from "api";
import { useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { getInstallerPath } from "pages/installer";
import { pathName as systemPathName } from "pages/system";
import { subPaths as systemSubPaths } from "pages/system/data";
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
import { prettyFullName } from "utils/format";
import newTabProps from "utils/newTabProps";
import { HttpsPortalMapping } from "@dappnode/types";
import { httpsPortalDnpName } from "params";
import "./https-mapping.scss";
import { urlJoin } from "utils/url";
import { ReqStatus } from "types";

export function HttpsMappings({ dnpName, serviceName }: { dnpName: string; serviceName: string }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState("");
  const [port, setPort] = useState("80");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [fromError, setFromError] = useState<string | null>(null);
  const [portError, setPortError] = useState<string | null>(null);
  const [userAndPasswordError, setUserAndPasswordError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const mappings = useApi.httpsPortalMappingsGet();
  const dnpsRequest = useApi.packagesGet();
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);

  useEffect(() => {
    if (mappings.data) {
      const fromErr = validateFromSubdomain(from, mappings.data);
      const portErr = validatePort(port);
      const userAndPasswordErr = validateUserAndPassword(user, password);

      setFromError(fromErr);
      setPortError(portErr);
      setUserAndPasswordError(userAndPasswordErr);

      const isFormValid = !fromErr && !portErr && !userAndPasswordErr;

      setIsValid(isFormValid);
    }
  }, [from, port, user, password, mappings.data]);

  // DO NOT - Prefill the `from` input with the recommended subdomain on every select change
  // Why? To des-incentivize users from randomly creating mappings for services that may
  // conflict with pre-defined mappings in System > Network

  /** Add the new mapping created in the local editor */
  async function addMapping() {
    if (reqStatus.loading) return;

    const mapping: HttpsPortalMapping = {
      fromSubdomain: from,
      dnpName,
      serviceName,
      port: parseInt(port),
      auth: user && password ? { username: user, password } : undefined,
      external: true
    };

    try {
      await confirmPromise({
        title: "Exposing service",
        text: "Are you sure you want to expose this service to the public internet?",
        label: "Expose",
        variant: "dappnode"
      });

      setReqStatus({ loading: true });
      await withToast(() => api.httpsPortalMappingAdd({ mapping }), {
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
      await withToast(() => api.httpsPortalMappingRemove({ mapping }), {
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

  // Helper UI in case the HTTPs Portal is bad
  if (dnpsRequest.data) {
    const httpsPortalDnp = dnpsRequest.data.find((dnp) => dnp.dnpName === httpsPortalDnpName);
    if (!httpsPortalDnp) {
      const url = `${getInstallerPath(httpsPortalDnpName)}/${httpsPortalDnpName}`;
      return (
        <Alert variant="secondary">
          You must{" "}
          <a href="#" onClick={() => navigate(url)}>
            install the HTTPs Portal
          </a>{" "}
          to use this feature
        </Alert>
      );
    }
  }

  if (mappings.data) {
    const serviceMappings = mappings.data.filter(
      (mapping) => showAll || (mapping.dnpName === dnpName && mapping.serviceName === serviceName)
    );

    return (
      <div className="network-mappings">
        <p>
          It recommended to only expose the pre-approved safe services listed in{" "}
          <NavLink to={urlJoin(systemPathName, systemSubPaths.network)}>System / Network</NavLink>. Please, only add
          custom mappings manually if you understand the security risks
        </p>

        <div className="list-grid">
          {/* Table header */}

          <header className="name">CONTAINER</header>
          <header className="name" />
          <header className="name">SUBDOMAIN</header>
          <header className="name">AUTH</header>
          <header className="header">REMOVE</header>

          <hr />

          {serviceMappings.length === 0 && <span className="no-mappings">No mappings</span>}

          {serviceMappings.map((mapping) => (
            <React.Fragment key={mapping.fromSubdomain}>
              <span className="name">
                {prettyFullName(mapping)} : {mapping.port}
              </span>
              <span className="name">
                <BsArrowRight />
              </span>

              <span className="name">
                <a href={`https://${mapping.fromSubdomain}.${dappnodeIdentity.domain}`} {...newTabProps}>
                  {mapping.fromSubdomain}
                  <wbr />.{dappnodeIdentity.domain}
                </a>
              </span>

              <span className="name">{mapping.auth ? `${mapping.auth.username}` : "-"}</span>

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
              },
              {
                label: "User",
                labelId: "user",
                required: false,
                value: user,
                onValueChange: setUser,
                error: userAndPasswordError
              },
              {
                label: "Password",
                labelId: "password",
                required: false,
                secret: true,
                value: password,
                onValueChange: setPassword,
                error: userAndPasswordError
              }
            ]}
          >
            <Button type="submit" variant="dappnode" onClick={addMapping} disabled={!isValid || reqStatus.loading}>
              Add mapping
            </Button>
          </InputForm>
        )}

        <div className="bottom-buttons">
          <div className="show-all">
            Show all
            <Switch checked={showAll} onToggle={setShowAll} />
          </div>

          {editing ? (
            <Button onClick={() => setEditing(false)}>Cancel</Button>
          ) : (
            <Button className="new-mapping-button" variant="dappnode" onClick={() => setEditing(true)}>
              New mapping <MdAdd />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (dnpsRequest.error) return <ErrorView error={dnpsRequest.error} hideIcon red />;
  if (mappings.error) return <ErrorView error={mappings.error} hideIcon red />;

  if (dnpsRequest.isValidating) return <Ok loading msg="Loading HTTPS portal" />;
  if (mappings.isValidating) return <Ok loading msg="Loading mappings" />;

  return <ErrorView error={"No data"} hideIcon red />;
}

function validateFromSubdomain(from: string, mappings: HttpsPortalMapping[]): string | null {
  if (!from) {
    return "from subdomain is empty";
  }

  const dupMapping = mappings.find((m) => m.fromSubdomain === from);
  if (dupMapping) {
    return `subdomain is already used to map to ${prettyFullName(dupMapping)}`;
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

function validateUserAndPassword(user: string, password: string): string | null {
  if (!user && !password) return null;
  if (!password) return "Invalid empty password";
  if (!user) return "Invalid empty user";
  // regex for user. it must not contain special characters
  const userRegex = new RegExp("^[a-zA-Z0-9]*$");
  if (!userRegex.test(user)) return "User must contain only letters and numbers";

  const passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})");
  if (!passwordRegex.test(password))
    return "Password must contain at least 8 characters, one uppercase, one lowercase, one number";

  return null;
}
