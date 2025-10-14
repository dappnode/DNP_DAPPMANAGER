import { CustomAccordion, CustomAccordionItem } from "components/CustomAccordion";
import { docsUrl, externalUrlProps } from "params";
import React from "react";

export function VpnDocsGuide({ variant }: { variant: "openvpn" | "wireguard" | "tailscale" }) {
  const docsUrlMap = {
    openvpn: docsUrl.openVpn,
    wireguard: docsUrl.wireguardVpn,
    tailscale: docsUrl.tailscaleVpn
  } as const;

  const variantName = variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <CustomAccordion>
      <CustomAccordionItem header={<>How to set up {variantName}</>}>
        <div>
          To set up and access your Dappnode using {variantName}, please follow our{" "}
          <a href={docsUrlMap[variant]} {...externalUrlProps}>
            official step-by-step {variantName} setup guide
          </a>
          .
        </div>
      </CustomAccordionItem>
    </CustomAccordion>
  );
}
