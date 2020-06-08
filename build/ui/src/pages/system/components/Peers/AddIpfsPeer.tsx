import React, { useState, useEffect, useMemo } from "react";
import * as ipfs from "utils/ipfs";
// Components
import Card from "components/Card";
import Input from "components/Input";
import Button from "components/Button";
import Ok from "components/Ok";

/**
 * peer = "/dns4/1bc3641738cbe2b1.dyndns.dappnode.io/tcp/4001/ipfs/QmWAcZZCvqVnJ6J9946qxEMaAbkUj6FiiVWakizVKfnfDL"
 */

/**
 * curl "http://ipfs.dappnode:5001/api/v0/id"
 * {
 *   ID: "QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap",
 *   PublicKey: "AsDFGHJkKjHGfDsQwErTyUiKNDsdFGhjKkJhGFdSeRtYUiJhFDsdfGHjIGcG/bGeEo3+BYjFkjMLor/thjk8wq4chVNCj+VH8RuKzQrkCJr++1i3NFHpJaRsy0zuXPWRJcO2sRVJn6ZMUG1lM/cFlpBpb3VSj1AFeoIXec547Bz36Q7AQdKWxwskRBJ1gCo0unJ4lsBBongstuywTtPReLbki+jb3OgOwcfiRM/uq/kP0bq6rBzLRx0d5cYIo4cQdoN4IaL/99TEKji/sLOPZEQdzYq0UV6yk3uTpza9pq1kL6Nd4obY6F1QW7BUw/vunxHMThtD+j1+5M84FHLFWjRaoOnhJ6PLLzM0f40FOOvLUzdwdDm4eBXBjUZpWUO+mpoOAkwxAgMBAAE=",
 *   Addresses: [
 *     "/ip4/127.0.0.1/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap",
 *     "/ip4/172.33.1.5/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap",
 *     "/ip4/85.200.85.20/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap"
 *   ],
 *   AgentVersion: "go-ipfs/0.4.20/8efc82534",
 *   ProtocolVersion: "ipfs/0.1.0"
 * }
 *
 * curl "http://ipfs.dappnode:5001/api/v0/bootstrap/add?arg=/dnsaddr/bacd1234acdb1234.dyndns.dappnode.io/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap"
 * {
 *   "Peers":[ "/dnsaddr/bacd1234acdb1234.dyndns.dappnode.io/tcp/4001/ipfs/QmWAcZZCvqVnJ6J9946qxEMaAbkUj6FiiVWakizVKfnfDL" ]
 * }
 *
 * Multiaddress possible prefixes:
 * - /ip4/
 * - /dns4/
 * - /dnsaddr/
 */

export default function AddIpfsPeer({ peerFromUrl }: { peerFromUrl: string }) {
  const [peerInput, setPeerInput] = useState("");
  const [addStat, setAddStat] = useState<{
    msg?: string;
    ok?: boolean;
    error?: boolean;
    loading?: boolean;
  }>({});

  const addIpfsPeer = useMemo(
    () => async (peer: string) => {
      try {
        if (!peer) throw Error("Peer must be defined");
        setAddStat({ loading: true, msg: "Connecting to peer..." });
        await ipfs.addSwarmConnection(peer);
        setAddStat({ loading: true, msg: "Adding peer to boostrap list" });
        await ipfs.addBootstrap(peer);
        setAddStat({ ok: true, msg: "Successfully connected and saved peer" });
      } catch (e) {
        console.error(`Error on addIpfsPeer (${peer}): ${e.stack}`);
        setAddStat({ error: true, msg: e.message });
      }
    },
    [setAddStat]
  );

  useEffect(() => {
    if (peerFromUrl) {
      addIpfsPeer(peerFromUrl);
      setPeerInput(peerFromUrl);
    }
  }, [peerFromUrl, addIpfsPeer]);

  return (
    <>
      <Card spacing>
        <div>
          Add an IPFS peer to your own boostrap list and immediately connect to
          it.
        </div>

        <Input
          placeholder="Peer address /ip4/85.200.85.20/tcp/4001/ipfs/QmWas..."
          value={peerInput}
          // Ensure id contains only alphanumeric characters
          onValueChange={value => {
            setAddStat({});
            setPeerInput(value);
          }}
          onEnterPress={() => {
            if (!addStat.loading) addIpfsPeer(peerInput);
          }}
          append={
            <Button
              variant="dappnode"
              onClick={() => addIpfsPeer(peerInput)}
              disabled={addStat.loading || !peerInput}
            >
              Add peer
            </Button>
          }
        />

        {addStat.msg && (
          <Ok
            msg={addStat.msg}
            ok={addStat.ok}
            loading={addStat.loading}
            style={{ marginTop: "1rem" }}
          />
        )}
      </Card>
    </>
  );
}
