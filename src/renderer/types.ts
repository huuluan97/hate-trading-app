import { NetworkInfo } from './constants/networks/types';

export interface WalletInfo {
  address: string;
  balance: number;
  ethBalance: string;
  connected: boolean;
  chainId?: number;
  type: 'mnemonic' | 'privateKey' | null;
  canSign: boolean;
}

export interface MnemonicWalletInfo {
  address: string;
  mnemonic: string;
  privateKey: string;
  publicKey: string;
  path: string;
}

export interface PrivateKeyWalletInfo {
  address: string;
  privateKey: string;
  publicKey: string;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  balance?: number;
  value?: number;
  address?: string;
}

export interface CustomToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  networkKey: string;
  addedAt: number;
  logo?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'swap';
  amount: number;
  price: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  fromToken?: string;
  toToken?: string;
}

export interface Portfolio {
  totalValue: number;
  ethValue: number;
  assets: CryptoAsset[];
  pnl24h: number;
}

export interface AppState {
  wallet: WalletInfo;
  portfolio: Portfolio;
  selectedAsset: CryptoAsset | null;
  trades: Trade[];
  cryptoPrices: CryptoAsset[];
  customTokens: CustomToken[];
  mnemonicWallet: MnemonicWalletInfo | null;
  isLoading: boolean;
  error: string | null;
  currentNetwork: string;
  availableNetworks: Record<string, NetworkInfo>;
}
