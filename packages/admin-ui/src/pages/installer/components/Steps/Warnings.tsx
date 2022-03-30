import React from "react";
import Card from "components/Card";
import { PackageReleaseMetadata } from "types";
import RenderMarkdown from "components/RenderMarkdown";
import Button from "components/Button";

export default function Warnings({
  goNext,
  goBack,
  warnings
}: {
  goNext: () => void;
  goBack: () => void;
  warnings: PackageReleaseMetadata["warnings"];
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
              <strong>Installation warning</strong>
            </span>
          </div>
          <div>
            <RenderMarkdown source={warnings.onInstall} />
          </div>
        </div>
      )}
      {warnings.onPatchUpdate && (
        <div>
          <div className="card-section-header">
            <span>
              <strong>Update patch warning</strong>
            </span>
          </div>
          <div>
            <RenderMarkdown source={warnings.onPatchUpdate} />
          </div>
        </div>
      )}
      {warnings.onMinorUpdate && (
        <div>
          <div className="card-section-header">
            <span>
              <strong>Update minor warning</strong>
            </span>
          </div>
          <div>
            <RenderMarkdown source={warnings.onMinorUpdate} />
          </div>
        </div>
      )}
      {warnings.onMajorUpdate && (
        <div>
          <div className="card-section-header">
            <span>
              <strong>Update major warning</strong>
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
