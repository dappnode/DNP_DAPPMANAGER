import React, { useState } from "react";
import { useApi } from "api";
import Loading from "components/Loading";
import { externalUrlProps, docsUrl, tailscaleDnpName } from "params";
import { prettyDnpName } from "utils/format";
import { NoDnpInstalled } from "pages/packages/components/NoDnpInstalled";
import ErrorView from "components/ErrorView";
import { Config } from "pages/packages/components/Config";
import { Accordion, Card } from "react-bootstrap";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export function TailscaleVpn() {
  const dnpRequest = useApi.packageGet({ dnpName: tailscaleDnpName });
  const dnp = dnpRequest.data;

  const [isGuideOpen, setIsGuideOpen] = useState(true);

  if (!dnp) {
    return (
      <>
        {dnpRequest.isValidating ? (
          <Loading steps={[`Loading ${prettyDnpName(tailscaleDnpName)}`]} />
        ) : dnpRequest.error ? (
          dnpRequest.error.message.includes("No DNP was found") ? (
            <NoDnpInstalled id={tailscaleDnpName} />
          ) : (
            <ErrorView error={dnpRequest.error} />
          )
        ) : null}
      </>
    );
  }

  const { userSettings, setupWizard } = dnp;
  return (
    <>
      <Accordion defaultActiveKey={isGuideOpen ? "0" : ""}>
        <Card>
          <Accordion.Toggle
            as={Card.Header}
            eventKey="0"
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            style={{ cursor: "pointer" }}
          >
            <b>How to set up Tailscale</b> {isGuideOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              <div>
                <p>
                  To set up and access your Dappnode using Tailscale, please follow our
                  <a href={docsUrl.tailscaleVpn} {...externalUrlProps}>
                    official step-by-step Tailscale setup guide
                  </a>
                  .
                </p>
              </div>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
      <Config dnpName={dnp.dnpName} {...{ userSettings, setupWizard }} />
    </>
  );
}
