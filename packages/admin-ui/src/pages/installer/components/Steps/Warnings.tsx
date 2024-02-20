import React from "react";
import Card from "components/Card";
import { RequestedDnp } from "@dappnode/types";
import { Manifest } from "@dappnode/types";
import RenderMarkdown from "components/RenderMarkdown";
import Button from "components/Button";

export default function Warnings({
  goNext,
  goBack,
  warnings,
  isInstalled,
  updateType
}: {
  goNext: () => void;
  goBack: () => void;
  warnings: Manifest["warnings"];
  isInstalled: RequestedDnp["isInstalled"];
  updateType?: "" | "downgrade" | "major" | "minor" | "patch" | null;
}) {
  if (!warnings)
    return (
      <Card>
        <div>No warnings to display</div>
      </Card>
    );

  return (
    <Card>
      {isInstalled ? (
        warnings.onInstall ? (
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
        ) : null
      ) : updateType === "patch" && warnings.onPatchUpdate ? (
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
      ) : updateType === "minor" && warnings.onMinorUpdate ? (
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
      ) : updateType === "major" && warnings.onMajorUpdate ? (
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
      ) : null}

      <div className="button-group">
        <Button onClick={goBack}>Back</Button>
        <Button variant="dappnode" onClick={goNext}>
          Next
        </Button>
      </div>
    </Card>
  );
}
