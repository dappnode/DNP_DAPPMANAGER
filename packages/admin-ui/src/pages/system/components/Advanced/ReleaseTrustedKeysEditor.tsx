import React, { useState } from "react";
import Button from "components/Button";
import { api, useApi } from "api";
import { InputForm } from "components/InputForm";
import { withToastNoThrow } from "components/toast/Toast";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import Card from "components/Card";
import { confirm } from "components/ConfirmDialog";
import {
  TrustedReleaseKey,
  ReleaseSignatureProtocol,
  releaseSignatureProtocols
} from "@dappnode/common";
import "./releaseTrustedKeysEditor.scss";
import { MdClose } from "react-icons/md";

export function ReleaseTrustedKeysEditor() {
  const [addingKey, setAddingKey] = useState(false);
  const trustedKeys = useApi.releaseTrustedKeyList();

  return (
    <Card spacing>
      {trustedKeys.data ? (
        <ReleaseTrustedKeysGrid
          keys={trustedKeys.data}
          onEdit={trustedKeys.revalidate}
        />
      ) : trustedKeys.error ? (
        <ErrorView error={trustedKeys.error} hideIcon red />
      ) : trustedKeys.isValidating ? (
        <Ok loading msg="Fetching release trusted keys..." />
      ) : null}

      {addingKey ? (
        <>
          <hr />
          <ReleaseTrustedKeysAdder onEdit={trustedKeys.revalidate} />
        </>
      ) : (
        <Button type="submit" onClick={() => setAddingKey(true)}>
          Add new key
        </Button>
      )}
    </Card>
  );
}

function ReleaseTrustedKeysGrid({
  keys,
  onEdit
}: {
  keys: TrustedReleaseKey[];
  onEdit: () => void;
}) {
  async function removeTrustedKey(keyName: string) {
    await new Promise<void>(resolve =>
      confirm({
        title: `Are you sure you want to remove the key ${keyName}?`,
        text:
          "Your DAppNode won't be to safely verify releases signed by this key.",
        label: "Remove",
        variant: "danger",
        onClick: resolve
      })
    );

    await withToastNoThrow(() => api.releaseTrustedKeyRemove(keyName), {
      message: "Removing trusted key...",
      onSuccess: "Removed trusted key"
    });

    onEdit();
  }

  return (
    <div className="list-grid release-trusted-keys-grid">
      {/* Table header */}
      <header>KEY NAME</header>
      <header>PACKAGES</header>
      <header>PROTOCOL</header>
      <header>KEY</header>
      <header>REMOVE</header>

      <hr />

      {keys.map(key => (
        <React.Fragment key={key.name}>
          <span>{key.name}</span>
          <span>{key.dnpNameSuffix}</span>
          <span>{key.signatureProtocol}</span>
          <span className="key" title={key.key}>
            {key.key}
          </span>
          <span onClick={() => removeTrustedKey(key.name)}>
            <MdClose />
          </span>
        </React.Fragment>
      ))}

      {keys.length === 0 && <span className="empty">No keys</span>}
    </div>
  );
}

function ReleaseTrustedKeysAdder({ onEdit }: { onEdit: () => void }) {
  const [keyName, setKeyName] = useState("");
  const [dnpNameSuffix, setDnpNameSuffix] = useState("");
  const [signatureProtocol, setSignatureProtocol] = useState<string>(
    releaseSignatureProtocols[0]
  );
  const [key, setKey] = useState("");

  async function addTrustedKey() {
    const trustedKey: TrustedReleaseKey = {
      name: keyName,
      dnpNameSuffix,
      signatureProtocol: signatureProtocol as ReleaseSignatureProtocol,
      key
    };

    withToastNoThrow(() => api.releaseTrustedKeyAdd(trustedKey), {
      message: "Adding trusted key...",
      onSuccess: "Added trusted key"
    });

    onEdit();
  }

  return (
    <InputForm
      fields={[
        {
          label: "Key name",
          labelId: "key-name",
          name: "key-name",
          autoComplete: "key-name",
          placeholder: "DAppNode Association",
          value: keyName,
          onValueChange: setKeyName
        },
        {
          label: "Package name suffix",
          labelId: "dnp-name-suffix",
          name: "dnp-name-suffix",
          autoComplete: "dnp-name-suffix",
          placeholder: ".dnp.dappnode.eth",
          value: dnpNameSuffix,
          onValueChange: setDnpNameSuffix
        },
        {
          label: "Signature protocol",
          labelId: "signature-protocol",
          name: "signature-protocol",
          autoComplete: "signature-protocol",
          options: releaseSignatureProtocols,
          value: signatureProtocol,
          onValueChange: setSignatureProtocol
        },
        {
          label: "Key",
          labelId: "trusted-key",
          name: "trusted-key",
          autoComplete: "trusted-key",
          placeholder: "0xabcd1234...",
          value: key,
          onValueChange: setKey
        }
      ]}
    >
      <Button type="submit" onClick={addTrustedKey} variant="dappnode">
        Submit key
      </Button>
    </InputForm>
  );
}
