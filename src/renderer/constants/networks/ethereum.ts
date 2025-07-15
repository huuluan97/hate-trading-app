import { ChainId, NetworkInfo } from './types';

const EMPTY_ARRAY: any[] = [];
const NOT_SUPPORT = null;

const ethereumInfo: NetworkInfo = {
  chainId: ChainId.ETHEREUM,
  route: 'ethereum',
  ksSettingRoute: 'ethereum',
  priceRoute: 'ethereum',
  aggregatorRoute: 'ethereum',
  name: 'Ethereum',
  icon: 'https://ethereum.org/static/4f10d2777b2d14759feb01c65b2765f7/69ce8/eth-diamond-purple.png',
  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://etherscan.io',
  etherscanName: 'Etherscan',
  bridgeURL: 'https://bridge.arbitrum.io',

  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: 'https://ethereum.org/static/4f10d2777b2d14759feb01c65b2765f7/69ce8/eth-diamond-purple.png',
    decimal: 18,
  },

  defaultRpcUrl: 'https://eth.llamarpc.com',
  backupRpcUrls: [
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
    'https://eth-mainnet.g.alchemy.com/v2/demo',
    'https://cloudflare-eth.com',
  ],

  multicall: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',

  classic: {
    defaultSubgraph:
      'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-ethereum',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: ['0x31De05f28568e3d3D612BFA6A78B356676367470'],
  },

  elastic: {
    defaultSubgraph:
      'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-mainnet',
    startBlock: 14532937,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash:
      '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910F99b5a5c3e4c5A0A4a7f9',
    farms: ['0x7D5ba536ab244aAA1EA42aB88428847F25E3E676'],
    farmv2Quoter: '0x6AFeb9EDd6Cf44fA8E89b1eee28284e6dD7705C8',
    farmV2S: [
      '0xBdEc4a045446F583dc564C0A227FFd475b329bf0',
      '0x3D6AfE2fB73fFEd2E3dD00c501A174554e147a43',
      '0xf2BcDf38baA52F6b0C1Db5B025DfFf01Ae1d6dBd',
    ],
    zap: {
      router: '0x30C5322E4e08AD500c348007f92f120ab4E2b79e',
      validator: '0xf0096e5B4AAfeEA1DF557264091569ba125c1172',
      executor: '0x8ac7895130e3be8654fff544ae20bf2a93ef19d1',
      helper: '0x214061F0e250A27a49f609d9caf2987a7bC8fA6B',
    },
  },

  limitOrder: '*',
  averageBlockTimeInSeconds: 13,
  coingeckoNetworkId: 'ethereum',
  coingeckoNativeTokenId: 'ethereum',
  dexToCompare: 'uniswapv3',
  geckoTermialId: 'ethereum',
  isTestnet: false,

  tokens: {
    ETH: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logo: 'https://ethereum.org/static/4f10d2777b2d14759feb01c65b2765f7/69ce8/eth-diamond-purple.png',
    },
    USDC: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    USDT: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 6,
      logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
    DAI: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
    },
    WBTC: {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
    },
    UNI: {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    },
    LINK: {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    },
  },
};

export default ethereumInfo;
