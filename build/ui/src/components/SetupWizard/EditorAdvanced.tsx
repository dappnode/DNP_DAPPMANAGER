import React from "react";
import { orderBy, isEmpty } from "lodash";
// Components
import TableInputs from "components/TableInputs";
import { UserSettingsAllDnps } from "types";
import { shortNameCapitalized } from "utils/format";

interface EditableTableProps {
  headers: string[];
  placeholder: string;
  values?: { [valueId: string]: string };
  disabledValues?: { [valueId: string]: boolean };
  setValue: (valueId: string, value: string) => void;
}

const EditableTable: React.FunctionComponent<EditableTableProps> = ({
  headers,
  placeholder,
  values,
  disabledValues,
  setValue
}) => {
  if (!values || isEmpty(values)) return null;
  const valuesArray = orderBy(
    Object.entries(values).map(([key, value]) => ({ id: key, value })),
    ["id"]
  );
  return (
    <TableInputs
      headers={headers}
      content={valuesArray.map(({ id, value = "" }) => [
        { disabled: true, value: id },
        {
          placeholder,
          value,
          onValueChange: (newValue: string) => setValue(id, newValue),
          disabled: (disabledValues || {})[id]
        }
      ])}
      rowsTemplate=""
    />
  );
};

export function EditorAdvanced({
  userSettings,
  onChange
}: {
  userSettings: UserSettingsAllDnps;
  onChange: (newUserSettings: UserSettingsAllDnps) => void;
}) {
  return (
    <div className="dnps-section">
      {Object.entries(userSettings).map(([dnpName, dnpSettings]) => (
        <div className="dnp-section" key={dnpName}>
          <div className="dnp-name">{shortNameCapitalized(dnpName)}</div>
          <EditableTable
            headers={["Env name", "Env value"]}
            placeholder="enter value..."
            values={dnpSettings.environment}
            setValue={(valueId, envValue) =>
              onChange({
                [dnpName]: {
                  environment: { [valueId]: envValue }
                }
              })
            }
          />
          <EditableTable
            headers={["Port - container", "Port - host"]}
            placeholder="Ephemeral port if unspecified"
            values={dnpSettings.portMappings}
            setValue={(valueId, hostPort) =>
              onChange({
                [dnpName]: {
                  portMappings: { [valueId]: hostPort }
                }
              })
            }
          />
          {/* Rules for volumes
               - Can't be edited if they are already set 
          */}
          <EditableTable
            headers={["Volume name", "Custom mountpoint path"]}
            placeholder="default docker location if unspecified"
            values={dnpSettings.namedVolumeMountpoints}
            setValue={(valueId, mountpointHostPath) =>
              onChange({
                [dnpName]: {
                  namedVolumeMountpoints: { [valueId]: mountpointHostPath }
                }
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
