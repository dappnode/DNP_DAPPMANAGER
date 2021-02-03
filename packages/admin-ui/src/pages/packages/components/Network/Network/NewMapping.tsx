import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/esm/Form";
import Input from "components/Input";
import Button from "components/Button";
import { getPublicSubdomain } from "utils/domains";
import "./network.scss";
import { MdAdd } from "react-icons/md";
import { useSelector } from "react-redux";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { shortNameCapitalized as sn } from "utils/format";
import { HttpsPortalMapping } from "common";

export function HttpsPortalNewMapping({
  dnpName,
  serviceName,
  mappings,
  addMapping
}: {
  dnpName: string;
  serviceName: string;
  mappings: HttpsPortalMapping[];
  addMapping: (mapping: HttpsPortalMapping) => void;
}) {
  const [editing, setEditing] = useState(false);

  // Initialize the selector with the first DNP to prefil values
  const [from, setFrom] = useState("");
  const [port, setPort] = useState("80");

  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);

  // Prefill the `from` input with the recommended subdomain on every select change
  useEffect(() => {
    setFrom(getPublicSubdomain({ dnpName, serviceName }));
  }, [dnpName, serviceName]);

  const errors: string[] = [];
  if (!from) errors.push("from subdomain is empty");
  const dupMapping = mappings.find(m => m.fromSubdomain === from);
  if (dupMapping) {
    const target = `${sn(dupMapping.dnpName)} ${sn(dupMapping.serviceName)}`;
    errors.push(`subdomain is already used to map to ${target}`);
  }

  if (!editing) {
    return (
      <div className="bottom-buttons">
        <span />
        <Button
          className="new-mapping-button"
          variant="dappnode"
          onClick={() => setEditing(true)}
        >
          New mapping <MdAdd />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Form.Group>
        <Form.Label>From subdomain</Form.Label>
        <Input value={from} onValueChange={setFrom} />
        <Form.Text className="text-muted">
          https://{from}.{dappnodeIdentity.domain ?? "??"}
        </Form.Text>
      </Form.Group>

      <Form.Group>
        <Form.Label>To port</Form.Label>
        <Input type="number" value={port} onValueChange={setPort} />
      </Form.Group>

      <div className="form-errors">
        {errors.map((error, i) => (
          <div key={i}>{error}</div>
        ))}
      </div>

      <div className="bottom-buttons">
        <Button
          variant="dappnode"
          onClick={() =>
            addMapping({
              fromSubdomain: from,
              dnpName,
              serviceName,
              port: parseInt(port)
            })
          }
          disabled={errors.length > 0}
        >
          Apply
        </Button>
        <Button onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </>
  );
}
