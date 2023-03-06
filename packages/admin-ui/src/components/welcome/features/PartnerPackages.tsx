import { PartnerExtraPackage } from "@dappnode/common";
import { api } from "api";
import React, { useEffect, useState } from "react";
import BottomButtons from "../BottomButtons";

/**
 * View to show the user the partner packages
 * that should be installed during the onboarding process
 */
export default function PartnerPackages({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  const [partnerPackages, setPartnerPackages] = useState<PartnerExtraPackage[]>(
    []
  );

  // Call partnerExtraPkgsGet() on mount
  useEffect(() => {
    async function fetchPartnerPackages(){
      setPartnerPackages(await api.partnerExtraPkgsGet());
    }

    fetchPartnerPackages();

  }, []);

  async function install() {
    // Move ahead
    onNext();

    // TODO: Install partner packages
  }

  return (
    <>
      <div className="header">
        <div className="title">Partner packages</div>
        <div className="description">
          You have purchased a DAppNode box with partner packages. Here you have
          them!
        </div>
      </div>

      {/* TODO: Show partner packages in list like packages page */}

      <BottomButtons onBack={onBack} onNext={install} />
    </>
  );
}
