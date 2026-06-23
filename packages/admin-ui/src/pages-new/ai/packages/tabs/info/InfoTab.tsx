import React from "react";
import { InstalledPackageDetailData } from "@dappnode/types";
import { GettingStartedSection } from "./GettingStartedSection";
import { VersionCard } from "./VersionCard";
import { PackageSentDataCard } from "./PackageSentDataCard";
import { ContainersCard } from "./ContainersCard";
import { VolumesCard } from "./VolumesCard";
import { RemovePackageCard } from "./RemovePackageCard";

export function InfoTab({ dnp }: { dnp: InstalledPackageDetailData }) {
  const { manifest, gettingStarted, gettingStartedShow } = dnp;

  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      <GettingStartedSection
        dnpName={dnp.dnpName}
        gettingStarted={gettingStarted}
        gettingStartedShow={gettingStartedShow}
      />
      <VersionCard dnp={dnp} manifest={manifest} />
      <PackageSentDataCard dnpName={dnp.dnpName} data={dnp.packageSentData} />
      <ContainersCard dnp={dnp} />
      <VolumesCard dnp={dnp} />
      <RemovePackageCard dnp={dnp} />
    </div>
  );
}
