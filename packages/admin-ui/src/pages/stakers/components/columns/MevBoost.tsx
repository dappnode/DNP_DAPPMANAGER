import React, { useState } from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import { StakerItem, StakerItemOk } from "common";
import "./columns.scss";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { MdCheck, MdClose } from "react-icons/md";
import { rootPath as installedRootPath } from "pages/installer";
import { Link } from "react-router-dom";
import { Network } from "types";
import { Table } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { getDefaultRelays, RelayIface } from "pages/stakers/data";

export default function MevBoost<T extends Network>({
  network,
  mevBoost,
  setNewMevBoost,
  isSelected,
  ...props
}: {
  network: T;
  mevBoost: StakerItem<T, "mev-boost">;
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
            <Link to={`${installedRootPath}/${mevBoost.dnpName}`}>
              <Button variant="dappnode">UPDATE</Button>
            </Link>
            <br />
            <br />
          </>
        )}

      {mevBoost.status === "ok" && isSelected && (
        <RelaysList
          network={network}
          mevBoost={mevBoost}
          setNewMevBoost={setNewMevBoost}
        />
      )}

      {mevBoost.status === "ok" && (
        <div className="description">
          {isSelected && mevBoost.metadata.shortDescription}
        </div>
      )}
    </Card>
  );
}

function RelaysList<T extends Network>({
  network,
  mevBoost,
  setNewMevBoost
}: {
  network: T;
  mevBoost: StakerItemOk<T, "mev-boost">;
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
            <th>OFAC</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {defaultRelays.map((relay, index) => (
            <Relay
              key={index}
              relay={relay}
              mevBoost={mevBoost}
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
  mevBoost,
  setNewMevBoost
}: {
  relay: RelayIface;
  mevBoost: StakerItemOk<T, "mev-boost">;
  setNewMevBoost: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "mev-boost"> | undefined>
  >;
}) {
  const [isAdded, setIsAdded] = useState(
    mevBoost.relays?.includes(relay.url) ? true : false
  );

  return (
    <tr>
      <td>{relay.operator}</td>
      <td>
        {relay.ofacCompliant === undefined ? (
          "-"
        ) : relay.ofacCompliant ? (
          <MdCheck color="#1ccec0" />
        ) : (
          <MdClose color="#ff0000" />
        )}
      </td>
      <td>
        <Form.Check
          onChange={() => {
            if (!isAdded) {
              setNewMevBoost({
                ...mevBoost,
                relays: [...(mevBoost.relays || []), relay.url]
              });
              setIsAdded(!isAdded);
            } else {
              setNewMevBoost({
                ...mevBoost,
                relays: mevBoost.relays?.filter(r => r !== relay.url)
              });
              setIsAdded(!isAdded);
            }
          }}
          checked={isAdded}
        />
      </td>
    </tr>
  );
}
