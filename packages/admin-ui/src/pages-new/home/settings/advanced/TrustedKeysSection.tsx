import React, { useState } from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { releaseSignatureProtocols } from "@dappnode/types";
import type { TrustedReleaseKey, ReleaseSignatureProtocol } from "@dappnode/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Badge } from "components/primitives/badge";
import { Skeleton } from "components/primitives/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "components/primitives/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "components/primitives/select";
import { Plus, X } from "lucide-react";

export function TrustedKeysSection() {
  const [addingKey, setAddingKey] = useState(false);
  const trustedKeys = useApi.releaseTrustedKeyList();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Trusted Release Keys</CardTitle>
        <CardDescription>
          Manage the cryptographic keys used to verify the authenticity of Dappnode package
          releases.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        {trustedKeys.isValidating && !trustedKeys.data && (
          <Skeleton className="tw:h-16 tw:w-full" />
        )}

        {trustedKeys.data && trustedKeys.data.length > 0 && (
          <div className="tw:rounded-lg tw:border tw:overflow-hidden">
            <table className="tw:w-full tw:text-sm">
              <thead className="tw:bg-muted/50">
                <tr>
                  <th className="tw:p-2 tw:text-left tw:font-medium">Name</th>
                  <th className="tw:p-2 tw:text-left tw:font-medium">Packages</th>
                  <th className="tw:p-2 tw:text-left tw:font-medium">Protocol</th>
                  <th className="tw:p-2 tw:text-center tw:font-medium tw:w-16" />
                </tr>
              </thead>
              <tbody>
                {trustedKeys.data.map((key) => (
                  <tr key={key.name} className="tw:border-t">
                    <td className="tw:p-2">{key.name}</td>
                    <td className="tw:p-2 tw:text-muted-foreground">{key.dnpNameSuffix}</td>
                    <td className="tw:p-2">
                      <Badge variant="outline">{key.signatureProtocol}</Badge>
                    </td>
                    <td className="tw:p-2 tw:text-center">
                      <RemoveKeyButton
                        keyName={key.name}
                        onRemoved={() => trustedKeys.revalidate()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {trustedKeys.data?.length === 0 && (
          <p className="tw:text-sm tw:text-muted-foreground">No trusted keys configured.</p>
        )}

        {addingKey ? (
          <AddKeyForm
            onDone={() => {
              setAddingKey(false);
              trustedKeys.revalidate();
            }}
            onCancel={() => setAddingKey(false)}
          />
        ) : (
          <Button variant="outline" onClick={() => setAddingKey(true)}>
            <Plus className="tw:size-3.5" />
            Add Key
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Helper components ─────────────────────────────────────────────── */

function RemoveKeyButton({
  keyName,
  onRemoved
}: {
  keyName: string;
  onRemoved: () => void;
}) {
  async function removeKey() {
    try {
      toast.loading("Removing trusted key...");
      await api.releaseTrustedKeyRemove(keyName);
      toast.success("Key removed");
      onRemoved();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <X className="tw:size-3.5 tw:text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove key &quot;{keyName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Your Dappnode won&apos;t be able to safely verify releases signed by this key.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={removeKey}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AddKeyForm({
  onDone,
  onCancel
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [keyName, setKeyName] = useState("");
  const [dnpNameSuffix, setDnpNameSuffix] = useState("");
  const [signatureProtocol, setSignatureProtocol] = useState<string>(releaseSignatureProtocols[0]);
  const [key, setKey] = useState("");

  async function addKey() {
    const trustedKey: TrustedReleaseKey = {
      name: keyName,
      dnpNameSuffix,
      signatureProtocol: signatureProtocol as ReleaseSignatureProtocol,
      key
    };
    try {
      toast.loading("Adding trusted key...");
      await api.releaseTrustedKeyAdd(trustedKey);
      toast.success("Key added");
      onDone();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const isValid = keyName && dnpNameSuffix && key;

  return (
    <div className="tw:rounded-lg tw:border tw:p-4 tw:space-y-3">
      <div className="tw:space-y-2">
        <Label htmlFor="key-name">Key name</Label>
        <Input
          id="key-name"
          placeholder="Dappnode Association"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
        />
      </div>
      <div className="tw:space-y-2">
        <Label htmlFor="dnp-suffix">Package name suffix</Label>
        <Input
          id="dnp-suffix"
          placeholder=".dnp.dappnode.eth"
          value={dnpNameSuffix}
          onChange={(e) => setDnpNameSuffix(e.target.value)}
        />
      </div>
      <div className="tw:space-y-2">
        <Label>Signature protocol</Label>
        <Select value={signatureProtocol} onValueChange={setSignatureProtocol}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {releaseSignatureProtocols.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="tw:space-y-2">
        <Label htmlFor="trusted-key-value">Key</Label>
        <Input
          id="trusted-key-value"
          placeholder="0xabcd1234..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </div>
      <div className="tw:flex tw:gap-2">
        <Button disabled={!isValid} onClick={addKey}>
          Submit Key
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
