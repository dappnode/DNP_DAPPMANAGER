import React from "react";
import { orderBy, isEmpty } from "lodash-es";
// Components
import Input from "components/Input";
import { UserSettingsAllDnps } from "@dappnode/common";
import { prettyDnpName } from "utils/format";
import "./editorAdvanced.scss";

interface EditableTableProps {
  headers: string[];
  placeholder: string;
  values?: { [valueId: string]: string };
  disabledValues?: { [valueId: string]: boolean };
  setValue: (valueId: string, value: string) => void;
}

const EditableTable: React.FC<EditableTableProps> = ({
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
    <table className="editor-advanced-table">
      <thead>
        <tr>
          {headers.map(header => (
            <td key={header} className="subtle-header">
              {header}
            </td>
          ))}
        </tr>
      </thead>
      <tbody>
        {valuesArray.map(({ id, value = "" }) => (
          <tr key={id}>
            <td>
              <Input lock={true} value={id} onValueChange={() => {}} />
            </td>
            <td>
              <Input
                placeholder={placeholder}
                value={value}
                onValueChange={(newValue: string) => setValue(id, newValue)}
                lock={(disabledValues || {})[id]}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
          <div className="dnp-name">{prettyDnpName(dnpName)}</div>
          {dnpSettings.environment &&
            Object.entries(dnpSettings.environment).map(
              ([serviceName, environment]) => (
                <div className="service-section" key={serviceName}>
                  <div className="service-name">
                    {prettyDnpName(serviceName)}
                  </div>
                  <EditableTable
                    headers={["Env name", "Env value"]}
                    placeholder="enter value..."
                    values={environment}
                    setValue={(valueId, envValue) =>
                      onChange({
                        [dnpName]: {
                          environment: {
                            [serviceName]: { [valueId]: envValue }
                          }
                        }
                      })
                    }
                  />
                </div>
              )
            )}

          {dnpSettings.portMappings &&
            Object.entries(dnpSettings.portMappings).map(
              ([serviceName, portMappings]) => (
                <div className="service-section" key={serviceName}>
                  <div className="service-name">
                    {prettyDnpName(serviceName)}
                  </div>
                  <EditableTable
                    headers={["Port - container", "Port - host"]}
                    placeholder="Ephemeral port if unspecified"
                    values={portMappings}
                    setValue={(valueId, hostPort) =>
                      onChange({
                        [dnpName]: {
                          portMappings: {
                            [serviceName]: { [valueId]: hostPort }
                          }
                        }
                      })
                    }
                  />
                </div>
              )
            )}

          {/* Rules for volumes: Can't be edited if they are already set */}
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
