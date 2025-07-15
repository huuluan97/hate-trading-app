import { NetworkInfo } from './types';
import ethereumInfo from './ethereum';
import optimismInfo from './optimism';
import arbitrumInfo from './arbitrum';
import bscInfo from './bsc';

export const NETWORKS: Record<string, NetworkInfo> = {
  ethereum: ethereumInfo,
  optimism: optimismInfo,
  arbitrum: arbitrumInfo,
  bsc: bscInfo,
};

export const getNetworkInfo = (networkKey: string): NetworkInfo => {
  return NETWORKS[networkKey] || NETWORKS.ethereum;
};

export const getNetworkByChainId = (
  chainId: number,
): NetworkInfo | undefined => {
  return Object.values(NETWORKS).find((network) => network.chainId === chainId);
};

export const getSupportedChainIds = (): number[] => {
  return Object.values(NETWORKS).map((network) => network.chainId);
};

export const getNetworkIcon = (networkKey: string): string => {
  const network = NETWORKS[networkKey];
  return network?.icon || '';
};

export const getNetworkTokens = (networkKey: string) => {
  const network = NETWORKS[networkKey];
  return network?.tokens || {};
};

export const getNetworkRpcUrls = (networkKey: string): string[] => {
  const network = NETWORKS[networkKey];
  return network ? [network.defaultRpcUrl, ...network.backupRpcUrls] : [];
};

export * from './types';
export { ethereumInfo, optimismInfo, arbitrumInfo, bscInfo };
