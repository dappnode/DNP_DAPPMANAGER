import React, { useState } from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import { StakerItem, StakerItemOk, Network } from "@dappnode/types";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { AiFillInfoCircle } from "react-icons/ai";

interface RelayIface {
  operator: string;
  url: string;
  docs?: string;
  ofacCompliant?: boolean;
}
export default function MevBoost({
  network,
  mevBoost,
  newMevBoost,
  setNewMevBoost,
  newRelays,
  setNewRelays,
  isSelected,
  ...props
}: {
  network: Network;
  mevBoost: StakerItem;
  newMevBoost: StakerItemOk | null;
  setNewMevBoost: React.Dispatch<React.SetStateAction<StakerItemOk | null>>;
  newRelays: string[];
  setNewRelays: React.Dispatch<React.SetStateAction<string[]>>;
  isSelected: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card {...props} className={`mev-boost ${joinCssClass({ isSelected })}`} shadow={isSelected}>
      <div
        onClick={
          mevBoost.status === "ok"
            ? isSelected
              ? () => setNewMevBoost(null)
              : () => setNewMevBoost(mevBoost)
            : undefined
        }
      >
        {mevBoost.status === "ok" ? (
          <div className="avatar">
            <img src={mevBoost.avatarUrl || defaultAvatar} alt="avatar" />
          </div>
        ) : mevBoost.status === "error" ? (
          <div className="avatar">
            <img src={errorAvatar} alt="avatar" />
          </div>
        ) : null}

        <div className="title">{prettyDnpName(mevBoost.dnpName)} </div>
      </div>

      {mevBoost.status === "ok" && isSelected && mevBoost.isInstalled && !mevBoost.isUpdated && (
        <>
          <Button
            onClick={() => navigate(`${getInstallerPath(mevBoost.dnpName)}/${mevBoost.dnpName}`)}
            variant="dappnode"
          >
            UPDATE
          </Button>
          <br />
          <br />
        </>
      )}

      {newMevBoost?.status === "ok" && isSelected && (
        <RelaysList network={network} newRelays={newRelays} setNewRelays={setNewRelays} />
      )}

      {mevBoost.status === "ok" && (
        <div className="description">{isSelected && mevBoost.data?.manifest?.shortDescription}</div>
      )}
    </Card>
  );
}

function RelaysList({
  network,
  newRelays,
  setNewRelays
}: {
  network: Network;
  newRelays: string[];
  setNewRelays: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const defaultRelays = getDefaultRelays(network);
  if (defaultRelays.length > 0)
    return (
      <Table striped hover size="sm">
        <thead>
          <tr>
            <th>Relay</th>
            <th>
              OFAC
              <a href="https://www.mevwatch.info/" target="_blank" rel="noopener noreferrer" className="hide-on-small">
                <AiFillInfoCircle />
              </a>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {defaultRelays.map((relay, index) => (
            <Relay key={index} relay={relay} newRelays={newRelays} setNewRelays={setNewRelays} />
          ))}
        </tbody>
      </Table>
    );
  return null;
}

function Relay({
  relay,
  newRelays,
  setNewRelays
}: {
  relay: RelayIface;
  newRelays: string[];
  setNewRelays: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [isAdded, setIsAdded] = useState(newRelays.includes(relay.url) ? true : false);

  return (
    <tr>
      <td>
        {relay.docs ? (
          <a href={relay.docs} target="_blank" rel="noreferrer">
            {relay.operator}
          </a>
        ) : (
          <>{relay.operator}</>
        )}
      </td>
      <td>{relay.ofacCompliant === undefined ? "-" : relay.ofacCompliant ? "Yes" : "No"}</td>
      <td>
        <Form.Check
          onChange={() => {
            if (!isAdded) {
              setNewRelays([...newRelays, relay.url]);
              setIsAdded(true);
            } else {
              setNewRelays(newRelays.filter((r) => r !== relay.url));
              setIsAdded(false);
            }
          }}
          checked={isAdded}
        />
      </td>
    </tr>
  );
}

// Utils

// bloxroute (maxprofit) is OFAC compliant as of Dec 2023: https://x.com/bloXrouteLabs/status/1736819783520092357
// Info on all relays specs: https://github.com/eth-educators/ethstaker-guides/blob/main/MEV-relay-list.md
const getDefaultRelays = (network: Network): RelayIface[] => {
  switch (network) {
    case "mainnet":
      return [
        {
          operator: "Agnostic Boost",
          ofacCompliant: false,
          docs: "https://agnostic-relay.net/",
          url:
            "https://0xa7ab7a996c8584251c8f925da3170bdfd6ebc75d50f5ddc4050a6fdc77f2a3b5fce2cc750d0865e05d7228af97d69561@agnostic-relay.net"
        },
        {
          operator: "Ultra Sound",
          ofacCompliant: false,
          docs: "https://relay.ultrasound.money/",
          url:
            "https://0xa1559ace749633b997cb3fdacffb890aeebdb0f5a3b6aaa7eeeaf1a38af0a8fe88b9e4b1f61f236d2e64d95733327a62@relay.ultrasound.money"
        },
        {
          operator: "Flashbots",
          ofacCompliant: true,
          docs: "https://boost.flashbots.net/",
          url:
            "https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net"
        },
        {
          operator: "bloXroute (Max profit)",
          ofacCompliant: true,
          docs: "https://bloxroute.com/",
          url:
            "https://0x8b5d2e73e2a3a55c6c87b8b6eb92e0149a125c852751db1422fa951e42a09b82c142c3ea98d0d9930b056a3bc9896b8f@bloxroute.max-profit.blxrbdn.com"
        },
        {
          operator: "bloXroute (Regulated)",
          ofacCompliant: true,
          docs: "https://bloxroute.com/",
          url:
            "https://0xb0b07cd0abef743db4260b0ed50619cf6ad4d82064cb4fbec9d3ec530f7c5e6793d9f286c4e082c0244ffb9f2658fe88@bloxroute.regulated.blxrbdn.com"
        },
        {
          operator: " Titan (Non-Filtered)",
          ofacCompliant: false,
          docs: "https://docs.titanrelay.xyz/",
          url:
            "https://0x8c4ed5e24fe5c6ae21018437bde147693f68cda427cd1122cf20819c30eda7ed74f72dece09bb313f2a1855595ab677d@global.titanrelay.xyz"
        },
        {
          operator: " Titan (Filtered)",
          ofacCompliant: true,
          docs: "https://docs.titanrelay.xyz/",
          url:
            "https://0x8c4ed5e24fe5c6ae21018437bde147693f68cda427cd1122cf20819c30eda7ed74f72dece09bb313f2a1855595ab677d@regional.titanrelay.xyz"
        },
        {
          operator: "Aestus",
          ofacCompliant: false,
          docs: "https://aestus.live/",
          url:
            "https://0xa15b52576bcbf1072f4a011c0f99f9fb6c66f3e1ff321f11f461d15e31b1cb359caa092c71bbded0bae5b5ea401aab7e@aestus.live"
        },
        {
          operator: "Manifold",
          ofacCompliant: false,
          docs: "https://kb.manifoldfinance.com/",
          url:
            "https://0x98650451ba02064f7b000f5768cf0cf4d4e492317d82871bdc87ef841a0743f69f0f1eea11168503240ac35d101c9135@mainnet-relay.securerpc.com"
        }
      ];
    case "prater":
      return [
        {
          operator: "Flashbots",
          docs: "https://www.flashbots.net/",
          url:
            "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@builder-relay-goerli.flashbots.net"
        },
        {
          operator: "bloXroute",
          docs: "https://bloxroute.com/",
          url:
            "https://0x821f2a65afb70e7f2e820a925a9b4c80a159620582c1766b1b09729fec178b11ea22abb3a51f07b288be815a1a2ff516@bloxroute.max-profit.builder.goerli.blxrbdn.com"
        },
        {
          operator: "Blocknative",
          docs: "https://www.blocknative.com/",
          url:
            "https://0x8f7b17a74569b7a57e9bdafd2e159380759f5dc3ccbd4bf600414147e8c4e1dc6ebada83c0139ac15850eb6c975e82d0@builder-relay-goerli.blocknative.com"
        },
        {
          operator: "Eden Network",
          docs: "https://docs.edennetwork.io/",
          url:
            "https://0xb1d229d9c21298a87846c7022ebeef277dfc321fe674fa45312e20b5b6c400bfde9383f801848d7837ed5fc449083a12@relay-goerli.edennetwork.io"
        },
        {
          operator: "Manifold",
          docs: "https://securerpc.com/",
          url:
            "https://0x8a72a5ec3e2909fff931c8b42c9e0e6c6e660ac48a98016777fc63a73316b3ffb5c622495106277f8dbcc17a06e92ca3@goerli-relay.securerpc.com/"
        }
      ];
    case "holesky":
      return [
        {
          operator: "Flashbots",
          docs: "https://www.flashbots.net/",
          url:
            "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@boost-relay-holesky.flashbots.net"
        },
        {
          operator: "Aestus",
          docs:
            "https://flashbots.notion.site/Relay-API-Documentation-5fb0819366954962bc02e81cb33840f5#417abe417dde45caaff3dc15aaae65dd",
          url:
            "https://0xab78bf8c781c58078c3beb5710c57940874dd96aef2835e7742c866b4c7c0406754376c2c8285a36c630346aa5c5f833@holesky.aestus.live"
        },
        {
          operator: "Ultrasound",
          docs: "https://github.com/ultrasoundmoney/frontend",
          url:
            "https://0xb1559beef7b5ba3127485bbbb090362d9f497ba64e177ee2c8e7db74746306efad687f2cf8574e38d70067d40ef136dc@relay-stag.ultrasound.money"
        },
        {
          operator: "Titan",
          docs: "https://docs.titanrelay.xyz/",
          url:
            "https://0xaa58208899c6105603b74396734a6263cc7d947f444f396a90f7b7d3e65d102aec7e5e5291b27e08d02c50a050825c2f@holesky.titanrelay.xyz"
        },
        {
          operator: "bloXroute",
          docs: "https://bloxroute.holesky.blxrbdn.com/",
          url:
            "https://0x821f2a65afb70e7f2e820a925a9b4c80a159620582c1766b1b09729fec178b11ea22abb3a51f07b288be815a1a2ff516@bloxroute.holesky.blxrbdn.com"
        }
      ];
    case "hoodi":
      return [
        // TODO: Add relays for hoodi when available
        {
          operator: "Flashbots",
          docs: "https://www.flashbots.net/",
          url: "https://*@boost-relay-hoodi.flashbots.net"
        }
      ];
    default:
      return [];
  }
};
