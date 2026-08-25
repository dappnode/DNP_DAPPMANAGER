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
  isDisabled,
  ...props
}: {
  network: Network;
  mevBoost: StakerItem;
  newMevBoost: StakerItemOk | null;
  setNewMevBoost: React.Dispatch<React.SetStateAction<StakerItemOk | null>>;
  newRelays: string[];
  setNewRelays: React.Dispatch<React.SetStateAction<string[]>>;
  isSelected: boolean;
  isDisabled?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card {...props} className={`mev-boost ${joinCssClass({ isSelected, isDisabled })}`} shadow={isSelected}>
      <div
        onClick={
          isDisabled
            ? undefined
            : mevBoost.status === "ok"
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
          operator: "Ultra Sound (filtered)",
          ofacCompliant: true,
          docs: "https://relay.ultrasound.money/",
          url:
            "https://0xa1559ace749633b997cb3fdacffb890aeebdb0f5a3b6aaa7eeeaf1a38af0a8fe88b9e4b1f61f236d2e64d95733327a62@relay-filtered.ultrasound.money"
        },
        {
          operator: "Flashbots",
          ofacCompliant: true,
          docs: "https://boost.flashbots.net/",
          url:
            "https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net"
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
        }
      ];
    case "hoodi":
      return [
        {
          operator: "Flashbots",
          docs: "https://www.flashbots.net/",
          url:
            "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@boost-relay-hoodi.flashbots.net"
        },
        {
          operator: "bloXroute",
          docs: "https://bloxroute.hoodi.blxrbdn.com/",
          url:
            "https://0x821f2a65afb70e7f2e820a925a9b4c80a159620582c1766b1b09729fec178b11ea22abb3a51f07b288be815a1a2ff516@bloxroute.hoodi.blxrbdn.com"
        },
        {
          operator: "Titan",
          docs: "https://docs.titanrelay.xyz/",
          url:
            "https://0xaa58208899c6105603b74396734a6263cc7d947f444f396a90f7b7d3e65d102aec7e5e5291b27e08d02c50a050825c2f@hoodi.titanrelay.xyz"
        },
        {
          operator: "Aestus",
          docs:
            "https://flashbots.notion.site/Relay-API-Documentation-5fb0819366954962bc02e81cb33840f5#417abe417dde45caaff3dc15aaae65dd",
          url:
            "https://0x98f0ef62f00780cf8eb06701a7d22725b9437d4768bb19b363e882ae87129945ec206ec2dc16933f31d983f8225772b6@hoodi.aestus.live"
        }
      ];
    default:
      return [];
  }
};
