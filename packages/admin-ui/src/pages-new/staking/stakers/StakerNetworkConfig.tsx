import React from "react";
import { api, useApi } from "api";
import { Network } from "@dappnode/types";
import { Skeleton } from "components/primitives/skeleton";
import { Button } from "components/primitives/button";
import { Alert, AlertDescription } from "components/primitives/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "components/primitives/collapsible";
import { TypographyH4 } from "components/primitives/typography";
import { toast } from "sonner";
import { ChevronDown, AlertTriangle, Info } from "lucide-react";
import { useStakerConfig } from "hooks/stakers/useStakerConfig";
import { useStakerModals } from "hooks/stakers/useStakerModals";
import {
  UpgradeToPremiumModal,
  ActivateBackupModal,
  StakerDisclaimerModal
} from "components/modals/StakersPremiumModals";
import { NetworkDef, mevBoostNetworks, smoothNetworks } from "./data";
import { ClientList } from "./ClientList";
import { MevBoostSection } from "./MevBoostSection";

interface StakerNetworkConfigProps {
  networkDef: NetworkDef;
}

/**
 * Per-network staker configuration panel.
 * Shows execution clients, consensus clients, remote signer, and MEV boost columns.
 */
export function StakerNetworkConfig({ networkDef }: StakerNetworkConfigProps) {
  const { network, description } = networkDef;
  const currentStakerConfigReq = useApi.stakerConfigGet({ network });

  const {
    reqStatus,
    setReqStatus,
    newExecClient,
    setNewExecClient,
    newConsClient,
    setNewConsClient,
    newMevBoost,
    setNewMevBoost,
    newRelays,
    setNewRelays,
    newWeb3signer,
    setNewWeb3signer,
    changes
  } = useStakerConfig(network, currentStakerConfigReq);

  const isExecutionChanged =
    newExecClient?.dnpName !==
    currentStakerConfigReq.data?.executionClients.find((ec) => ec.status === "ok" && ec.isSelected)?.dnpName;
  const isSignerSelected = Boolean(newWeb3signer?.isSelected);

  const {
    nonPremiumModalShow,
    nonPremiumModalOnClose,
    premiumModalShow,
    premiumModalOnClose,
    disclaimerModalShow,
    disclaimerModalOnClose,
    displayPremiumModals,
    displayDisclaimerModal
  } = useStakerModals({ network, isExecutionChanged, isSignerSelected });

  /* ── Apply changes ──────────────────────────────────────────────── */

  async function setNewConfig() {
    let showToast = false;
    try {
      if (!changes.isAllowed) return;

      const userApproved = await displayDisclaimerModal();
      if (!userApproved) return;

      setReqStatus({ loading: true });
      displayPremiumModals();

      const toastId = toast.loading("Setting new staker configuration…");
      await api.stakerConfigSet({
        stakerConfig: {
          network,
          executionDnpName: newExecClient?.dnpName || null,
          consensusDnpName: newConsClient?.dnpName || null,
          mevBoostDnpName: newMevBoost?.dnpName || null,
          web3signerDnpName: newWeb3signer?.dnpName || null,
          relays: newRelays
        }
      });
      toast.success("Successfully set new staker configuration", { id: toastId });
      setReqStatus({ result: true });
      showToast = true;
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setReqStatus({ error: e });
      showToast = true;
    } finally {
      if (showToast) {
        setReqStatus({ loading: true });
        const reloadId = toast.loading(`Reloading ${network} staker configuration…`);
        try {
          await currentStakerConfigReq.revalidate();
          toast.success(`Loaded ${network} staker configuration`, { id: reloadId });
        } catch (e) {
          toast.error(`Error reloading: ${e instanceof Error ? e.message : String(e)}`, { id: reloadId });
        }
        setReqStatus({ loading: false });
      }
    }
  }

  /* ── Loading / error states ─────────────────────────────────────── */

  if (currentStakerConfigReq.isValidating && !currentStakerConfigReq.data) {
    return (
      <div className="tw:space-y-4">
        <Skeleton className="tw:h-8 tw:w-48" />
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="tw:h-48 tw:rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (currentStakerConfigReq.error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="tw:size-4" />
        <AlertDescription>
          Error loading {network} configuration: {currentStakerConfigReq.error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const data = currentStakerConfigReq.data;
  if (!data) return null;

  const showMevBoost = mevBoostNetworks.includes(network) && data.mevBoost;
  const showSigner = network !== Network.Sepolia && data.web3Signer;

  return (
    <div className="tw:space-y-6">
      {/* Modals (reuse existing legacy modal components) */}
      <UpgradeToPremiumModal show={nonPremiumModalShow} onClose={nonPremiumModalOnClose} />
      <ActivateBackupModal show={premiumModalShow} onClose={premiumModalOnClose} network={network} />
      <StakerDisclaimerModal show={disclaimerModalShow} onClose={disclaimerModalOnClose} />

      {/* Info banners */}
      {network === Network.Sepolia && (
        <Alert>
          <Info className="tw:size-4" />
          <AlertDescription>
            <strong>Sepolia network is not intended for staking</strong>, as it only supports whitelisted validators.
            Running a Sepolia node is still useful for L2s, infrastructure testing, and other use cases.
          </AlertDescription>
        </Alert>
      )}

      {smoothNetworks.includes(network) && (
        <Alert>
          <Info className="tw:size-4" />
          <AlertDescription>
            <strong>Smooth is out!</strong> Discover the new MEV Smoothing Pool designed for solo validators.{" "}
            <a
              href="https://docs.dappnode.io/docs/smooth/"
              target="_blank"
              rel="noopener noreferrer"
              className="tw:underline tw:font-semibold"
            >
              Learn more
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Network description (collapsible) */}
      <Collapsible>
        <CollapsibleTrigger className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground tw:transition-colors tw:bg-transparent">
          <ChevronDown className="tw:size-4" />
          Network Description
        </CollapsibleTrigger>
        <CollapsibleContent className="tw:mt-2 tw:text-sm tw:text-muted-foreground tw:max-w-2xl tw:leading-relaxed">
          <p>{description}</p>
          <p className="tw:mt-2">
            Set up your Proof-of-Stake validator configuration: <br />
            (1) Choose an Execution Layer client <br />
            (2) Choose a Consensus Layer client (+ validator)
            {network !== Network.Sepolia && (
              <>
                <br />
                (3) Install the web3signer, which will hold the validator keys and sign
                {showMevBoost && (
                  <>
                    <br />
                    (4) Optional; delegate block-building capacities through the MEV Boost network
                  </>
                )}
              </>
            )}
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* ── Client sections ─────────────────────────────────────────── */}
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-6">
        {/* Execution Clients */}
        <div className="tw:space-y-3">
          <TypographyH4>Execution Clients</TypographyH4>
          <ClientList
            clients={data.executionClients}
            selectedDnpName={newExecClient?.dnpName ?? null}
            onSelect={(ec) => setNewExecClient(ec)}
            onDeselect={() => setNewExecClient(null)}
            isDisabled={reqStatus.loading}
          />
        </div>

        {/* Consensus Clients */}
        {data.consensusClients.length > 0 && (
          <div className="tw:space-y-3">
            <TypographyH4>Consensus Clients</TypographyH4>
            <ClientList
              clients={data.consensusClients}
              selectedDnpName={newConsClient?.dnpName ?? null}
              onSelect={(cc) => setNewConsClient(cc)}
              onDeselect={() => setNewConsClient(null)}
              isDisabled={reqStatus.loading}
            />
          </div>
        )}

        {/* Remote Signer */}
        {showSigner && (
          <div className="tw:space-y-3">
            <TypographyH4>Remote Signer</TypographyH4>
            <ClientList
              clients={[data.web3Signer]}
              selectedDnpName={newWeb3signer?.dnpName ?? null}
              onSelect={(s) => setNewWeb3signer(s)}
              onDeselect={() => setNewWeb3signer(null)}
              isDisabled={reqStatus.loading}
            />
          </div>
        )}

        {/* MEV Boost */}
        {showMevBoost && data.mevBoost && (
          <div className="tw:space-y-3">
            <TypographyH4>MEV Boost</TypographyH4>
            <MevBoostSection
              network={network}
              mevBoost={data.mevBoost}
              newMevBoost={newMevBoost}
              setNewMevBoost={setNewMevBoost}
              newRelays={newRelays}
              setNewRelays={setNewRelays}
              isSelected={data.mevBoost.dnpName === newMevBoost?.dnpName}
              isDisabled={reqStatus.loading}
            />
          </div>
        )}
      </div>

      {/* ── Apply button & validation ────────────────────────────── */}
      <div className="tw:border-t tw:pt-4 tw:flex tw:flex-col tw:gap-3">
        <div className="tw:flex tw:items-center tw:gap-3">
          <Button disabled={!changes.isAllowed || reqStatus.loading} onClick={setNewConfig}>
            Apply changes
          </Button>
        </div>

        {!changes.isAllowed && changes.reason && (
          <Alert variant={changes.severity === "danger" || changes.severity === "warning" ? "destructive" : "default"}>
            <AlertTriangle className="tw:size-4" />
            <AlertDescription>
              Cannot apply changes: <strong>{changes.reason}</strong>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
