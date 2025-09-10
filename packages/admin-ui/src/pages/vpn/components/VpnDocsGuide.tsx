import { docsUrl, externalUrlProps } from "params";
import React, { useState } from "react";
import { Accordion, Card } from "react-bootstrap";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export function VpnDocsGuide({ variant }: { variant: "openvpn" | "wireguard" | "tailscale" }) {
  const [isOpen, setIsOpen] = useState(true);
  const docsUrlMap = {
    openvpn: docsUrl.openVpn,
    wireguard: docsUrl.wireguardVpn,
    tailscale: docsUrl.tailscaleVpn
  };

  const variantName = variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <Accordion defaultActiveKey={isOpen ? "0" : ""}>
      <Card>
        <Accordion.Toggle
          as={Card.Header}
          eventKey="0"
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: "pointer" }}
        >
          <b>How to set up {variantName}</b> {isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          <Card.Body>
            <div>
              To set up and access your Dappnode using {variantName}, please follow our{" "}
              <a href={docsUrlMap[variant]} {...externalUrlProps}>
                official step-by-step {variantName} setup guide
              </a>
              .
            </div>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}
