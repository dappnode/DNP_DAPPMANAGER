import React from "react";
import { StakerItem, StakerItemOk } from "@dappnode/types";
import { RadioGroup, RadioGroupItem } from "components/primitives/radio-group";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions } from "components/primitives/item";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { cn } from "lib/utils";
import { prettyDnpName } from "utils/format";
import { useNavigate } from "react-router-dom";
import { CircleAlert, ArrowUpCircle, KeyRound } from "lucide-react";

/* ── Unselect sentinel ──────────────────────────────────────────────── */

/** RadioGroup doesn't natively support deselect — we use a hidden "none" value */
const NONE_VALUE = "__none__";

/* ── Props ──────────────────────────────────────────────────────────── */

interface ClientListProps {
  clients: StakerItem[];
  selectedDnpName: string | null;
  onSelect: (client: StakerItemOk) => void;
  onDeselect: () => void;
  isDisabled?: boolean;
}

/**
 * Radio-group list of clients. Exactly one can be selected at a time,
 * or none if the user clicks the already-selected item.
 */
export function ClientList({ clients, selectedDnpName, onSelect, onDeselect, isDisabled }: ClientListProps) {
  const handleValueChange = (value: string) => {
    if (value === NONE_VALUE) return;
    if (value === selectedDnpName) {
      onDeselect();
      return;
    }
    const match = clients.find((c) => c.dnpName === value);
    if (match && match.status === "ok") onSelect(match);
  };

  return (
    <RadioGroup
      value={selectedDnpName ?? NONE_VALUE}
      onValueChange={handleValueChange}
      disabled={isDisabled}
      className="tw:gap-2"
    >
      {clients.map((client) => (
        <ClientRow
          key={client.dnpName}
          client={client}
          isSelected={client.dnpName === selectedDnpName}
          isDisabled={isDisabled}
          onToggle={() => {
            if (client.status !== "ok") return;
            client.dnpName === selectedDnpName ? onDeselect() : onSelect(client as StakerItemOk);
          }}
        />
      ))}
    </RadioGroup>
  );
}

/* ── Single row ─────────────────────────────────────────────────────── */

function ClientRow({
  client,
  isSelected,
  isDisabled,
  onToggle
}: {
  client: StakerItem;
  isSelected: boolean;
  isDisabled?: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();

  const isError = client.status === "error";
  const isOk = client.status === "ok";
  const showUpdate = isOk && isSelected && client.isInstalled && !client.isUpdated;
  const keystoresUrl = isOk && isSelected && client.isInstalled ? client.data?.manifest?.links?.ui : undefined;

  return (
    <Item
      variant="outline"
      className={cn(
        "tw:cursor-pointer tw:select-none tw:transition-colors tw:hover:border-primary/50 tw:hover:bg-primary/5",
        isSelected && "tw:border-primary/50 tw:bg-primary/5",
        isDisabled && "tw:opacity-50 tw:pointer-events-none",
        isError && "tw:opacity-60 tw:cursor-not-allowed"
      )}
      onClick={onToggle}
    >
      {/* Radio indicator */}
      <RadioGroupItem
        value={client.dnpName}
        disabled={isDisabled || isError}
        className="tw:shrink-0"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Avatar */}
      <ItemMedia variant="image">
        {isOk ? (
          <img
            src={client.avatarUrl || "/assets/defaultAvatar.png"}
            alt={prettyDnpName(client.dnpName)}
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

      {/* Text */}
      <ItemContent>
        <ItemTitle>
          {prettyDnpName(client.dnpName)}
          {isError && (
            <Badge variant="destructive" className="tw:text-[10px] tw:px-1.5 tw:py-0">
              Error
            </Badge>
          )}
          {isOk && isSelected && client.isInstalled && client.isRunning && (
            <Badge variant="secondary" className="tw:text-[10px] tw:px-1.5 tw:py-0">
              Running
            </Badge>
          )}
        </ItemTitle>
        {isOk && client.data?.manifest?.shortDescription && (
          <ItemDescription>{client.data.manifest.shortDescription}</ItemDescription>
        )}
      </ItemContent>

      {/* Actions */}
      <ItemActions>
        {keystoresUrl && (
          <Button
            size="sm"
            variant="ghost"
            className="tw:gap-1.5 tw:text-xs"
            asChild
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <a href={keystoresUrl} target="_blank" rel="noreferrer noopener">
              <KeyRound className="tw:size-3" />
              Keystores
            </a>
          </Button>
        )}
        {showUpdate && (
          <Button
            size="sm"
            variant="outline"
            className="tw:gap-1.5 tw:text-xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/installer/${client.dnpName}`);
            }}
          >
            <ArrowUpCircle className="tw:size-3" />
            Update
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}
