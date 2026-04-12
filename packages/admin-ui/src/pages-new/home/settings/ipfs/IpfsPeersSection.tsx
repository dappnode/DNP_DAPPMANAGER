import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";

export function IpfsPeersSection() {
  const [peerInput, setPeerInput] = useState("");
  const [status, setStatus] = useState<{ msg?: string; ok?: boolean; loading?: boolean }>({});

  async function addPeer() {
    if (!peerInput) return;
    try {
      setStatus({ loading: true, msg: "Adding peer..." });
      // Use the IPFS API directly
      const addRes = await fetch(
        `http://ipfs.dappnode:5001/api/v0/swarm/connect?arg=${encodeURIComponent(peerInput)}`,
        {
          method: "POST"
        }
      );
      if (!addRes.ok) throw new Error("Failed to connect to peer");

      await fetch(`http://ipfs.dappnode:5001/api/v0/bootstrap/add?arg=${encodeURIComponent(peerInput)}`, {
        method: "POST"
      });

      setStatus({ ok: true, msg: "Peer added successfully" });
    } catch (e) {
      setStatus({ ok: false, msg: `Failed: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">IPFS Peers</CardTitle>
        <CardDescription>Connect to another Dappnode&apos;s IPFS node to peer-share content.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:space-y-2">
          <Label htmlFor="peer-multiaddr">Peer multiaddress</Label>
          <Input
            id="peer-multiaddr"
            placeholder="/dns4/example.dyndns.dappnode.io/tcp/4001/ipfs/Qm..."
            value={peerInput}
            onChange={(e) => setPeerInput(e.target.value)}
          />
        </div>
        <Button onClick={addPeer} disabled={!peerInput || status.loading}>
          {status.loading ? "Adding..." : "Add Peer"}
        </Button>
        {status.msg && (
          <p
            className={`tw:text-sm ${
              status.ok ? "tw:text-green-600" : status.ok === false ? "tw:text-destructive" : "tw:text-muted-foreground"
            }`}
          >
            {status.msg}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
