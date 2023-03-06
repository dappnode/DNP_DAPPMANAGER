import { PartnerExtraPackage } from "@dappnode/common";
import { api } from "api";
import React, { useEffect, useState } from "react";
import BottomButtons from "../BottomButtons";
import dappnodeIcon from "img/dappnode-logo-only.png";
import { Form } from "react-bootstrap";

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
    async function fetchPartnerPackages() {
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
          You have purchased a DAppNode box with partner packages. Select which
          ones you want to install.
        </div>
      </div>

      <PartnerPackagesList
        partnerPackages={partnerPackages}
        setPartnerPackages={setPartnerPackages}
      />

      <BottomButtons onBack={onBack} onNext={install} />
    </>
  );
}

function PartnerPackagesList({
  partnerPackages,
  setPartnerPackages
}: {
  partnerPackages: PartnerExtraPackage[];
  setPartnerPackages: (partnerPackages: PartnerExtraPackage[]) => void;
}) {
  function handlePackageInstallToggle(index: number) {
    const newPartnerPackages = [...partnerPackages];
    newPartnerPackages[index].selectedToInstall = !newPartnerPackages[index]
      ?.selectedToInstall;
    setPartnerPackages(newPartnerPackages);
  }

  return (
    <div className="list-grid dnps no-a-style">
      <header>Package</header>
      <header>Install?</header>
      {partnerPackages.map((pkg, index) => (
        <React.Fragment key={pkg.ipfs}>
          <img
            className="avatar"
            src={pkg.avatarUrl || dappnodeIcon}
            alt={pkg.title}
          />
          <span>{pkg.title}</span>
          <Form.Check
            className="toggle-checkbox"
            type="checkbox"
            checked={pkg.selectedToInstall}
            onChange={() => handlePackageInstallToggle(index)}
          />
          <hr />
        </React.Fragment>
      ))}
    </div>
  );
}
