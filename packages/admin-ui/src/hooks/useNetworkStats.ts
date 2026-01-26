import { DashboardSupportedNetwork, Network, NetworkStats, NodeStatus } from "@dappnode/types";
import { useApi, api } from "api";
import EthLogo from "img/logos/eth-logo.svg?react";
import GnosisLogo from "img/logos/gnosis-logo.svg?react";
import LuksoLogo from "img/logos/lukso-logo.svg?react";

const supportedNetworks: DashboardSupportedNetwork[] = [
  Network.Mainnet,
  Network.Gnosis,
  Network.Lukso,
  Network.Hoodi,
  Network.Sepolia
];

// Define network's logos and which ones have validators and rewards data
type NetworkFeatures = {
  hasValidators: boolean;
  hasRewardsData: boolean;
  logo: React.FC<React.SVGProps<SVGSVGElement>>;
};

const networkFeatures: Record<DashboardSupportedNetwork, NetworkFeatures> = {
  [Network.Mainnet]: { hasValidators: true, hasRewardsData: true, logo: EthLogo },
  [Network.Gnosis]: { hasValidators: true, hasRewardsData: false, logo: GnosisLogo },
  [Network.Lukso]: { hasValidators: true, hasRewardsData: false, logo: LuksoLogo },
  [Network.Hoodi]: { hasValidators: true, hasRewardsData: true, logo: EthLogo },
  [Network.Sepolia]: { hasValidators: false, hasRewardsData: false, logo: EthLogo }
};

export function useNetworkStats() {
  const nodesStatusReq = useApi.nodeStatusGetByNetwork({ networks: supportedNetworks });
  const consensusClientsReq = useApi.consensusClientsGetByNetworks({ networks: supportedNetworks });
  const executionClientsReq = useApi.executionClientsGetByNetworks({ networks: supportedNetworks });
  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork({ networks: supportedNetworks });
  const validatorsFilterAttestingReq = useApi.validatorsFilterAttestingByNetwork({ networks: supportedNetworks });
  const validatorsBalancesReq = useApi.validatorsBalancesByNetwork({ networks: supportedNetworks });
  const signersStatusReq = useApi.signerByNetworkGet({ networks: supportedNetworks });
  const beaconchaSharingConsentReq = useApi.beaconchaSharingConsentGet();

  const nodesStatusByNetwork = nodesStatusReq.data;
  const consensusClientsByNetwork = consensusClientsReq.data;
  const executionClientsByNetwork = executionClientsReq.data;
  const validatorsActiveByNetwork = validatorsFilterActiveReq.data;
  const validatorsAttestingByNetwork = validatorsFilterAttestingReq.data;
  const validatorsBalancesByNetwork = validatorsBalancesReq.data;
  const signersStatusByNetwork = signersStatusReq.data;
  const beaconchaSharingConsent = beaconchaSharingConsentReq.data;

  const clientsLoading =
    nodesStatusReq.isValidating || consensusClientsReq.isValidating || executionClientsReq.isValidating;

  const validatorsLoading =
    validatorsFilterActiveReq.isValidating ||
    validatorsFilterAttestingReq.isValidating ||
    validatorsBalancesReq.isValidating ||
    signersStatusReq.isValidating;

  const rewardsLoading = beaconchaSharingConsentReq.isValidating;

  const beaconchaConsentSet = async ({
    network,
    consent
  }: {
    network: DashboardSupportedNetwork;
    consent: boolean;
  }) => {
    try {
      await api.beaconchaSharingConsentSet({ network, consent });
      await beaconchaSharingConsentReq.revalidate();
    } catch (error) {
      console.error("Error setting beaconcha consent:", error);
      throw error;
    }
  };

  const networkStats: NetworkStats = {};

  for (const network of supportedNetworks) {
    const features = networkFeatures[network];
    const nodeStatusData: NodeStatus | undefined = nodesStatusByNetwork?.[network];
    const consensusClientDnp = consensusClientsByNetwork?.[network];
    const executionClientDnp = executionClientsByNetwork?.[network];
    const validatorsActive = validatorsActiveByNetwork?.[network];
    const validatorsAttesting = validatorsAttestingByNetwork?.[network];
    const balancesObj = validatorsBalancesByNetwork?.[network]?.balances;
    const signerStatus = signersStatusByNetwork?.[network] ?? { isInstalled: false, brainRunning: false };

    let total = 0;
    let attesting = 0;
    let balance = 0;
    let beaconError = undefined;

    if (features.hasValidators && validatorsActive) {
      total = validatorsActive.validators.length;
      beaconError = validatorsActive.beaconError;
    }
    if (features.hasValidators && validatorsAttesting) {
      attesting = validatorsAttesting.validators.length;
    }
    if (features.hasValidators && balancesObj && validatorsActive) {
      // Sum balances for active validators
      balance = validatorsActive.validators.reduce((acc, pk) => acc + (parseFloat(balancesObj[pk]) || 0), 0);
    }

    const validatorsData = features.hasValidators
      ? {
          validators: {
            total,
            balance,
            attesting,
            beaconError,
            signerStatus
          }
        }
      : undefined;

    const rewardsData = features.hasRewardsData
      ? {
          rewards: {
            APR: 3.321,
            ethPrice: 3800,
            "7days": 0.0045,
            "30days": 0.0123,
            "365days": 0.3321,
            efectivity: 99.9,
            proposals: 3,
            beaconchaConsent: beaconchaSharingConsent?.[network] ?? false
          }
        }
      : {};

    // Remove network where no node data is available
    if (nodeStatusData && (nodeStatusData.ec || nodeStatusData.cc)) {
      // Add DNP names stored in the db from staker config
      const nodeStatusWithDnps: NodeStatus = {
        ec: nodeStatusData.ec ? { ...nodeStatusData.ec, dnp: executionClientDnp || nodeStatusData.ec.dnp } : null,
        cc: nodeStatusData.cc ? { ...nodeStatusData.cc, dnp: consensusClientDnp || nodeStatusData.cc.dnp } : null
      };

      networkStats[network] = {
        nodeStatus: nodeStatusWithDnps,
        ...validatorsData,
        ...rewardsData,
        hasValidators: features.hasValidators,
        hasRewardsData: features.hasRewardsData
      };
    } else {
      delete networkStats[network];
    }

    console.log(`Network stats for ${network}:`, networkStats[network]);
  }

  // Provide a function to get the logo for a network
  function getNetworkLogo(network: DashboardSupportedNetwork) {
    return networkFeatures[network]?.logo || EthLogo;
  }

  return { networkStats, clientsLoading, getNetworkLogo, validatorsLoading, rewardsLoading, beaconchaConsentSet };
}
