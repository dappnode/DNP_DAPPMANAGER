import React from "react";
import Card from "components/Card";

export default function RemoteSigner({
  signer,
  isInstalled
}: {
  signer: string;
  isInstalled: boolean;
}) {
  return (
    <Card>
      <p>{signer}</p>
    </Card>
  );
}
