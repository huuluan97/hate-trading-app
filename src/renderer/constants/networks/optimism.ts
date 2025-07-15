import { ChainId, NetworkInfo } from './types';

const EMPTY_ARRAY: any[] = [];
const NOT_SUPPORT = null;

const optimismInfo: NetworkInfo = {
  chainId: ChainId.OPTIMISM,
  route: 'optimism',
  ksSettingRoute: 'optimism',
  priceRoute: 'optimism',
  aggregatorRoute: 'optimism',
  name: 'Optimism',
  icon: 'https://raw.githubusercontent.com/ethereum-optimism/brand-kit/main/assets/svg/OPTIMISM-R.svg',
  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://optimistic.etherscan.io',
  etherscanName: 'Optimistic Ethereum Explorer',
  bridgeURL: 'https://app.optimism.io/bridge/deposit',

  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: 'https://ethereum.org/static/4f10d2777b2d14759feb01c65b2765f7/69ce8/eth-diamond-purple.png',
    decimal: 18,
  },

  defaultRpcUrl: 'https://mainnet.optimism.io',
  backupRpcUrls: [
    'https://optimism.publicnode.com',
    'https://rpc.ankr.com/optimism',
    'https://optimism-mainnet.public.blastapi.io',
    'https://optimism.llamarpc.com',
    'https://optimism.blockpi.network/v1/rpc/public',
    'https://optimism-rpc.publicnode.com',
    'https://optimism.drpc.org',
  ],

  multicall: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',

  classic: {
    defaultSubgraph:
      'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-optimism',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: ['0x715Cc6C0d591CA3FA8EA6e4Cb445adA0DC79069A'],
  },

  elastic: {
    defaultSubgraph:
      'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-optimism',
    startBlock: 99665516,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash:
      '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: ['0x7D5ba536ab244aAA1EA42aB88428847F25E3E676'],
    farmv2Quoter: '0x6AFeb9EDd6Cf44fA8E89b1eee28284e6dD7705C8',
    farmV2S: [
      '0xA70a1Ad0F91c52c79e177c5A18a7C9E1C4360e0e',
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
  averageBlockTimeInSeconds: 2,
  coingeckoNetworkId: 'optimistic-ethereum',
  coingeckoNativeTokenId: 'ethereum',
  dexToCompare: 'uniswapv3',
  geckoTermialId: 'optimism',
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
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    USDT: {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 6,
      logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
    DAI: {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
    },
    WBTC: {
      address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
    },
    OP: {
      address: '0x4200000000000000000000000000000000000042',
      symbol: 'OP',
      name: 'Optimism',
      decimals: 18,
      logo: 'https://raw.githubusercontent.com/ethereum-optimism/brand-kit/main/assets/svg/OPTIMISM-R.svg',
    },
  },
};

export default optimismInfo;
