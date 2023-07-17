import React, { useState } from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import { StakerItem, StakerItemOk } from "@dappnode/common";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { relativePath as installedRelativePath } from "pages/installer";
import { Link } from "react-router-dom";
import { Table } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { AiFillInfoCircle } from "react-icons/ai";
import { Network } from "@dappnode/types";

interface RelayIface {
  operator: string;
  url: string;
  docs?: string;
  ofacCompliant?: boolean;
}
export default function MevBoost<T extends Network>({
  network,
  mevBoost,
  newMevBoost,
  setNewMevBoost,
  isSelected,
  ...props
}: {
  network: T;
  mevBoost: StakerItem<T, "mev-boost">;
  newMevBoost: StakerItemOk<T, "mev-boost"> | undefined;
  setNewMevBoost: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "mev-boost"> | undefined>
  >;
  isSelected: boolean;
}) {
  return (
    <Card
      {...props}
      className={`mev-boost ${joinCssClass({ isSelected })}`}
      shadow={isSelected}
    >
      <div
        onClick={
          mevBoost.status === "ok"
            ? isSelected
              ? () => setNewMevBoost(undefined)
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

      {mevBoost.status === "ok" &&
        isSelected &&
        mevBoost.isInstalled &&
        !mevBoost.isUpdated && (
          <>
            <Link to={`${installedRelativePath}/${mevBoost.dnpName}`}>
              <Button variant="dappnode">UPDATE</Button>
            </Link>
            <br />
            <br />
          </>
        )}

      {newMevBoost?.status === "ok" && isSelected && (
        <RelaysList
          network={network}
          newMevBoost={newMevBoost}
          setNewMevBoost={setNewMevBoost}
        />
      )}

      {mevBoost.status === "ok" && (
        <div className="description">
          {isSelected &&
            mevBoost.data &&
            mevBoost.data.metadata.shortDescription}
        </div>
      )}
    </Card>
  );
}

function RelaysList<T extends Network>({
  network,
  newMevBoost,
  setNewMevBoost
}: {
  network: T;
  newMevBoost: StakerItemOk<T, "mev-boost">;
  setNewMevBoost: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "mev-boost"> | undefined>
  >;
}) {
  const defaultRelays = getDefaultRelays(network);
  if (defaultRelays.length > 0)
    return (
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Relay</th>
            <th>
              OFAC
              <a
                href="https://www.mevwatch.info/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <AiFillInfoCircle />
              </a>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {defaultRelays.map((relay, index) => (
            <Relay
              key={index}
              relay={relay}
              newMevBoost={newMevBoost}
              setNewMevBoost={setNewMevBoost}
            />
          ))}
        </tbody>
      </Table>
    );
  return null;
}

function Relay<T extends Network>({
  relay,
  newMevBoost,
  setNewMevBoost
}: {
  relay: RelayIface;
  newMevBoost: StakerItemOk<T, "mev-boost">;
  setNewMevBoost: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "mev-boost"> | undefined>
  >;
}) {
  const [isAdded, setIsAdded] = useState(
    newMevBoost?.relays?.includes(relay.url) ? true : false
  );

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
      <td>
        {relay.ofacCompliant === undefined
          ? "-"
          : relay.ofacCompliant
          ? "Yes"
          : "No"}
      </td>
      <td>
        <Form.Check
          onChange={() => {
            if (!isAdded) {
              setNewMevBoost({
                ...newMevBoost,
                relays: [...(newMevBoost?.relays || []), relay.url]
              });
              setIsAdded(true);
            } else {
              setNewMevBoost({
                ...newMevBoost,
                relays: [
                  ...(newMevBoost?.relays?.filter(r => r !== relay.url) || [])
                ]
              });
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

const getDefaultRelays = <T extends Network>(network: T): RelayIface[] => {
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
          ofacCompliant: false,
          docs: "https://bloxroute.com/",
          url:
            "https://0x8b5d2e73e2a3a55c6c87b8b6eb92e0149a125c852751db1422fa951e42a09b82c142c3ea98d0d9930b056a3bc9896b8f@bloxroute.max-profit.blxrbdn.com"
        },
        {
          operator: "bloXroute (Ethical)",
          ofacCompliant: false,
          docs: "https://bloxroute.com/",
          url:
            "https://0xad0a8bb54565c2211cee576363f3a347089d2f07cf72679d16911d740262694cadb62d7fd7483f27afd714ca0f1b9118@bloxroute.ethical.blxrbdn.com"
        },
        {
          operator: "bloXroute (Regulated)",
          ofacCompliant: true,
          docs: "https://bloxroute.com/",
          url:
            "https://0xb0b07cd0abef743db4260b0ed50619cf6ad4d82064cb4fbec9d3ec530f7c5e6793d9f286c4e082c0244ffb9f2658fe88@bloxroute.regulated.blxrbdn.com"
        },
        {
          operator: "Blocknative",
          ofacCompliant: true,
          docs: "https://www.blocknative.com/",
          url:
            "https://0x9000009807ed12c1f08bf4e81c6da3ba8e3fc3d953898ce0102433094e5f22f21102ec057841fcb81978ed1ea0fa8246@builder-relay-mainnet.blocknative.com"
        },
        {
          operator: "Eden Network",
          ofacCompliant: true,
          docs: "https://docs.edennetwork.io/",
          url:
            "https://0xb3ee7afcf27f1f1259ac1787876318c6584ee353097a50ed84f51a1f21a323b3736f271a895c7ce918c038e4265918be@relay.edennetwork.io"
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
    default:
      return [];
  }
};
