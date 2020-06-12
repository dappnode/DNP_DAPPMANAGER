import React from "react";
// Components
import { SetupWizardAllDnps } from "types";
import { shortNameCapitalized } from "utils/format";
import RenderMarkdown from "components/RenderMarkdown";
import InputField from "./InputField";
import { SetupWizardError } from "pages/installer/parsers/formDataErrors";
import { SetupWizardFormDataReturn } from "pages/installer/types";

export function EditorV2({
  setupWizard,
  formData,
  errors,
  onNewFormData
}: {
  setupWizard: SetupWizardAllDnps;
  formData: SetupWizardFormDataReturn;
  errors: SetupWizardError[];
  onNewFormData: (newFormData: SetupWizardFormDataReturn) => void;
}) {
  return (
    <div className="dnps-section">
      {Object.entries(setupWizard).map(([dnpName, setupWizardDnp]) => (
        <div className="dnp-section" key={dnpName}>
          <div className="dnp-name">{shortNameCapitalized(dnpName)}</div>
          {setupWizardDnp.fields.map(field => {
            const { id } = field;
            const ownErrors = errors.filter(
              error => error.dnpName === dnpName && error.id === id
            );
            return (
              <div key={id} className="field">
                <div className="title">{field.title}</div>
                <div className="description">
                  <RenderMarkdown source={field.description} />
                </div>
                <InputField
                  field={field}
                  value={(formData[dnpName] || {})[id] || ""}
                  onValueChange={newValue =>
                    onNewFormData({ [dnpName]: { [id]: newValue } })
                  }
                />
                {ownErrors.map(error => (
                  <div key={error.type} className="error">
                    {error.message}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
