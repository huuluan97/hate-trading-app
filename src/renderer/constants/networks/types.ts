export interface NativeToken {
  symbol: string;
  name: string;
  logo: string;
  decimal: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
}

export interface ClassicDEX {
  defaultSubgraph: string;
  static: {
    zap: string;
    router: string;
    factory: string;
  };
  oldStatic: string | null;
  dynamic: string | null;
  claimReward: string | null;
  fairlaunch: string[];
  fairlaunchV2: string[];
}

export interface ElasticDEX {
  defaultSubgraph: string;
  startBlock: number;
  coreFactory: string;
  nonfungiblePositionManager: string;
  tickReader: string;
  initCodeHash: string;
  quoter: string;
  routers: string;
  farms: string[];
  farmv2Quoter: string;
  farmV2S: string[];
  zap: {
    router: string;
    validator: string;
    executor: string;
    helper: string;
  };
}

export interface NetworkInfo {
  chainId: number;
  route: string;
  ksSettingRoute: string;
  priceRoute: string;
  aggregatorRoute: string;
  name: string;
  icon: string;
  iconSelected: string | null;
  etherscanUrl: string;
  etherscanName: string;
  bridgeURL: string;
  nativeToken: NativeToken;
  defaultRpcUrl: string;
  backupRpcUrls: string[];
  multicall: string;
  classic: ClassicDEX;
  elastic: ElasticDEX;
  limitOrder: string;
  averageBlockTimeInSeconds: number;
  coingeckoNetworkId: string;
  coingeckoNativeTokenId: string;
  dexToCompare: string;
  geckoTermialId: string;
  tokens: Record<string, TokenInfo>;
  isTestnet: boolean;
}

export enum ChainId {
  ETHEREUM = 1,
  OPTIMISM = 10,
  ARBITRUM = 42161,
  BSC = 56,
  POLYGON = 137,
  AVALANCHE = 43114,
}
