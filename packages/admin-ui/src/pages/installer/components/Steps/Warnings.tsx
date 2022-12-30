import React from "react";
import Card from "components/Card";
import { RequestedDnp } from "@dappnode/common";
import RenderMarkdown from "components/RenderMarkdown";
import Button from "components/Button";
import { Manifest } from "@dappnode/dappnodesdk";

export default function Warnings({
  goNext,
  goBack,
  warnings,
  isInstalled
}: {
  goNext: () => void;
  goBack: () => void;
  warnings: Manifest["warnings"];
  isInstalled: RequestedDnp["isInstalled"];
}) {
  if (!warnings)
    return (
      <Card>
        <div>No warnings to display</div>
      </Card>
    );

  return (
    <Card>
      {warnings.onInstall && (
        <div>
          <div className="card-section-header">
            <span>
              <strong>Installation Warning</strong>
            </span>
          </div>
          <div>
            <RenderMarkdown source={warnings.onInstall} />
          </div>
        </div>
      )}
      {isInstalled && warnings.onPatchUpdate && (
        <div>
          <div className="card-section-header">
            <span>
              <strong>Patch Update Warning</strong>
            </span>
          </div>
          <div>
            <RenderMarkdown source={warnings.onPatchUpdate} />
          </div>
        </div>
      )}
      {isInstalled && warnings.onMinorUpdate && (
        <div>
          <div className="card-section-header">
            <span>
              <strong>Minor Update Warning</strong>
            </span>
          </div>
          <div>
            <RenderMarkdown source={warnings.onMinorUpdate} />
          </div>
        </div>
      )}
      {isInstalled && warnings.onMajorUpdate && (
        <div>
          <div className="card-section-header">
            <span>
              <strong>Major Update Warning</strong>
            </span>
          </div>
          <div>
            <RenderMarkdown source={warnings.onMajorUpdate} />
          </div>
        </div>
      )}

      <div className="button-group">
        <Button onClick={goBack}>Back</Button>
        <Button variant="dappnode" onClick={goNext}>
          Next
        </Button>
      </div>
    </Card>
  );
}
