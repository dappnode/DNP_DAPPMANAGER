import React from "react";
import Card from "components/Card";
import { PackageReleaseMetadata } from "types";
import RenderMarkdown from "components/RenderMarkdown";

export default function Warnings({
  warnings
}: {
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
    </Card>
  );
}
