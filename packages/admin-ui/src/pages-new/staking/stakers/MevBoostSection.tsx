import React, { useState } from "react";
import { Network, StakerItem, StakerItemOk } from "@dappnode/types";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup
} from "components/primitives/item";
import { Checkbox } from "components/primitives/checkbox";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { Switch } from "components/primitives/switch";
import { Separator } from "components/primitives/separator";
import { cn } from "lib/utils";
import { prettyDnpName } from "utils/format";
import { useNavigate } from "react-router-dom";
import { CircleAlert, ArrowUpCircle, Info, ExternalLink } from "lucide-react";
import { getDefaultRelays, RelayDef } from "./data";

/* ── Props ──────────────────────────────────────────────────────────── */

interface MevBoostSectionProps {
  network: Network;
  mevBoost: StakerItem;
  newMevBoost: StakerItemOk | null;
  setNewMevBoost: React.Dispatch<React.SetStateAction<StakerItemOk | null>>;
  newRelays: string[];
  setNewRelays: React.Dispatch<React.SetStateAction<string[]>>;
  isSelected: boolean;
  isDisabled?: boolean;
}

/**
 * MEV Boost toggle as a checkbox Item row, with an expandable relays list below.
 */
export function MevBoostSection({
  network,
  mevBoost,
  newMevBoost,
  setNewMevBoost,
  newRelays,
  setNewRelays,
  isSelected,
  isDisabled
}: MevBoostSectionProps) {
  const navigate = useNavigate();

  const isOk = mevBoost.status === "ok";
  const isError = mevBoost.status === "error";
  const showUpdate = isOk && isSelected && mevBoost.isInstalled && !mevBoost.isUpdated;

  const handleToggle = () => {
    if (isDisabled || !isOk) return;
    if (isSelected) {
      setNewMevBoost(null);
    } else {
      setNewMevBoost(mevBoost as StakerItemOk);
    }
  };

  return (
    <div className="tw:space-y-3">
      {/* Main toggle row */}
      <Item
        variant="outline"
        className={cn(
          "tw:cursor-pointer tw:select-none tw:transition-colors",
          isSelected && "tw:border-primary/50 tw:bg-primary/5",
          isDisabled && "tw:opacity-50 tw:pointer-events-none",
          isError && "tw:opacity-60 tw:cursor-not-allowed"
        )}
        onClick={handleToggle}
      >
        <Checkbox
          checked={isSelected}
          disabled={isDisabled || isError}
          onCheckedChange={() => handleToggle()}
          onClick={(e) => e.stopPropagation()}
        />

        <ItemMedia variant="image">
          {isOk ? (
            <img
              src={mevBoost.avatarUrl || "/assets/defaultAvatar.png"}
              alt={prettyDnpName(mevBoost.dnpName)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/assets/defaultAvatar.png";
              }}
            />
          ) : (
            <div className="tw:size-full tw:bg-destructive/10 tw:flex tw:items-center tw:justify-center tw:rounded-sm">
              <CircleAlert className="tw:size-4 tw:text-destructive" />
            </div>
          )}
        </ItemMedia>

        <ItemContent>
          <ItemTitle>
            {prettyDnpName(mevBoost.dnpName)}
            {isError && (
              <Badge variant="destructive" className="tw:text-[10px] tw:px-1.5 tw:py-0">
                Error
              </Badge>
            )}
          </ItemTitle>
          {isOk && mevBoost.data?.manifest?.shortDescription && (
            <ItemDescription>{mevBoost.data.manifest.shortDescription}</ItemDescription>
          )}
        </ItemContent>

        <ItemActions>
          {showUpdate && (
            <Button
              size="sm"
              variant="outline"
              className="tw:gap-1.5 tw:text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/installer/${mevBoost.dnpName}`);
              }}
            >
              <ArrowUpCircle className="tw:size-3" />
              Update
            </Button>
          )}
        </ItemActions>
      </Item>

      {/* Relay list — only when selected */}
      {newMevBoost?.status === "ok" && isSelected && (
        <RelaysList network={network} newRelays={newRelays} setNewRelays={setNewRelays} />
      )}
    </div>
  );
}

/* ── Relays ──────────────────────────────────────────────────────────── */

function RelaysList({
  network,
  newRelays,
  setNewRelays
}: {
  network: Network;
  newRelays: string[];
  setNewRelays: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const relays = getDefaultRelays(network);
  if (relays.length === 0) return null;

  return (
    <div className="tw:rounded-lg tw:border tw:bg-muted/30 tw:px-3 tw:py-2">
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium tw:text-muted-foreground tw:mb-2">
        Relays
        <a href="https://www.mevwatch.info/" target="_blank" rel="noopener noreferrer" className="tw:text-primary">
          <Info className="tw:size-3" />
        </a>
      </div>

      <ItemGroup>
        {relays.map((relay, i) => (
          <React.Fragment key={i}>
            <RelayRow relay={relay} newRelays={newRelays} setNewRelays={setNewRelays} />
            {i < relays.length - 1 && <Separator className="tw:my-0" />}
          </React.Fragment>
        ))}
      </ItemGroup>
    </div>
  );
}

function RelayRow({
  relay,
  newRelays,
  setNewRelays
}: {
  relay: RelayDef;
  newRelays: string[];
  setNewRelays: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [isAdded, setIsAdded] = useState(newRelays.includes(relay.url));

  const toggle = () => {
    if (isAdded) {
      setNewRelays(newRelays.filter((r) => r !== relay.url));
      setIsAdded(false);
    } else {
      setNewRelays([...newRelays, relay.url]);
      setIsAdded(true);
    }
  };

  return (
    <Item size="xs" variant="default" className="tw:py-1">
      <ItemContent>
        <ItemTitle className="tw:text-xs">
          {relay.docs ? (
            <a
              href={relay.docs}
              target="_blank"
              rel="noreferrer"
              className="tw:underline tw:underline-offset-4 tw:text-foreground tw:hover:text-primary"
            >
              {relay.operator}
              <ExternalLink className="tw:inline tw:size-2.5 tw:ml-0.5 tw:text-muted-foreground" />
            </a>
          ) : (
            relay.operator
          )}
          {relay.ofacCompliant !== undefined && (
            <Badge variant={relay.ofacCompliant ? "secondary" : "outline"} className="tw:text-[10px] tw:px-1 tw:py-0">
              {relay.ofacCompliant ? "OFAC" : "Non-OFAC"}
            </Badge>
          )}
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        <Switch checked={isAdded} onCheckedChange={toggle} />
      </ItemActions>
    </Item>
  );
}
