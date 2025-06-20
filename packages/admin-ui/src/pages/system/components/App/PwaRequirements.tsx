import React, { useEffect, useState } from "react";
import { api, useApi } from "api";
import { httpsPortalDnpName } from "params";
import Card from "components/Card";
import { Accordion } from "react-bootstrap";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import "./pwaRequirements.scss";
import Loading from "components/Loading";

export function PwaRequirements() {
  const httpsPkgReq = useApi.packageGet({ dnpName: httpsPortalDnpName });
  const httpsPkg = httpsPkgReq.data;
  console.log("httpsPkg", httpsPkg);
  const [isHttpsRunning, setIsHttpsRunning] = useState<boolean>(false);
  useEffect(() => {
    if (httpsPkg) {
      setIsHttpsRunning(httpsPkg.containers.every((c) => c.state === "running"));
    }
  }, [httpsPkg]);

  const httpsMappingsReq = useApi.httpsPortalMappingsGet();
  const httpsMappings = httpsMappingsReq.data;
  console.log("httpsMappings", httpsMappings);
  const [hasPwaMapping, setHasPwaMapping] = useState<boolean>(false);

  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const loading = httpsPkgReq.isValidating || httpsMappingsReq.isValidating;

  useEffect(() => {
    if (httpsMappings !== undefined) {
      if (httpsMappings.some((mapping) => mapping.fromSubdomain === "pwa")) {
        setHasPwaMapping(true);
      } else {
        setHasPwaMapping(false);
        api
          .httpsPortalPwaMappingAdd()
          .then(() => {
            httpsMappingsReq.revalidate();
          })
          .catch((error) => {
            console.error("Error adding PWA mapping:", error);
          });
      }
    }
  }, [httpsPkg]);

  return (
    <div>
      <Accordion defaultActiveKey={requirementsOpen ? "0" : ""}>
        <Accordion.Toggle
          as={Card}
          eventKey="0"
          onClick={() => setRequirementsOpen(!requirementsOpen)}
          style={{ cursor: "pointer" }}
        >
          <div className="requirements-header">
            <h4>Requirements</h4> {requirementsOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          {loading ? (
            <Loading steps={["Loading requirements"]} />
          ) : (
            <div className="requirements-body">
              <Card className={`requirements-card ${httpsPkg && isHttpsRunning ? "success" : "error"}`}>
                <h5>HTTPS package</h5>
                {httpsPkg ? (
                  <span>Installed {isHttpsRunning ? "and Running" : "but stopped"}</span>
                ) : (
                  <span>Not Installed</span>
                )}
              </Card>
              <Card className={`requirements-card ${hasPwaMapping ? "success" : "error"}`}>
                <h5>PWA mapping</h5>
                <span>{hasPwaMapping ? "PWA mapping enabled" : "Pwa mapping not found"}</span>
              </Card>
              <Card className="requirements-card">
                <h5>VPN Device</h5>
                <span>Ensure you have any VPN provider set it up in the device where you want to install the PWA</span>
              </Card>
            </div>
          )}
        </Accordion.Collapse>
      </Accordion>
    </div>
  );
}
