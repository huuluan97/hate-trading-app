import { ChainId, NetworkInfo } from './types';

const EMPTY_ARRAY: any[] = [];
const NOT_SUPPORT = null;

const bscInfo: NetworkInfo = {
  chainId: ChainId.BSC,
  route: 'bsc',
  ksSettingRoute: 'bsc',
  priceRoute: 'bsc',
  aggregatorRoute: 'bsc',
  name: 'BNB Smart Chain',
  icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://bscscan.com',
  etherscanName: 'BscScan',
  bridgeURL: 'https://bridge.binance.org',

  nativeToken: {
    symbol: 'BNB',
    name: 'BNB',
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    decimal: 18,
  },

  defaultRpcUrl: 'https://bsc.llamarpc.com',
  backupRpcUrls: [
    'https://rpc.ankr.com/bsc',
    'https://bsc-dataseed.binance.org',
    'https://bsc.publicnode.com',
    'https://bsc-dataseed1.defibit.io',
  ],

  multicall: '0xfF6FD90A470Aaa0c1B8A54681746b07AcdFedc9B',

  classic: {
    defaultSubgraph:
      'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-bsc',
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
      'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-bsc',
    startBlock: 26956207,
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
  averageBlockTimeInSeconds: 3,
  coingeckoNetworkId: 'binance-smart-chain',
  coingeckoNativeTokenId: 'binancecoin',
  dexToCompare: 'pancakeswap',
  geckoTermialId: 'bsc',
  isTestnet: false,

  tokens: {
    BNB: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    },
    USDC: {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    USDT: {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
    DAI: {
      address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
    },
    BUSD: {
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      symbol: 'BUSD',
      name: 'Binance USD',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/binance-usd-busd-logo.png',
    },
    WETH: {
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      logo: 'https://ethereum.org/static/4f10d2777b2d14759feb01c65b2765f7/69ce8/eth-diamond-purple.png',
    },
    CAKE: {
      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      symbol: 'CAKE',
      name: 'PancakeSwap',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
    },
  },
};

export default bscInfo;
