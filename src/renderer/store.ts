import { create } from 'zustand';
import {
  AppState,
  CryptoAsset,
  Trade,
  Portfolio,
  MnemonicWalletInfo,
  PrivateKeyWalletInfo,
  TransactionRequest,
} from './types';
import web3Service, { CustomToken, TokenInfo } from './services/web3Service';
import { NetworkInfo } from './constants/networks/types';
import { priceService } from './services/priceService';
import { persistence } from './utils/persistence';

interface AppStore extends AppState {
  currentNetwork: string;
  availableNetworks: Record<string, NetworkInfo>;
  customTokens: CustomToken[];
  mnemonicWallet: MnemonicWalletInfo | null;
  privateKeyWallet: PrivateKeyWalletInfo | null;
  connectWithMnemonic: (mnemonic: string, networkKey?: string) => Promise<void>;
  connectWithPrivateKey: (
    privateKey: string,
    networkKey?: string,
  ) => Promise<void>;
  validatePrivateKey: (privateKey: string) => boolean;
  disconnectWallet: () => void;
  updateBalance: (balance: number) => void;
  updateETHBalance: (ethBalance: string) => void;
  setSelectedAsset: (asset: CryptoAsset | null) => void;
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => void;
  updatePortfolio: (portfolio: Portfolio) => void;
  loadCryptoPrices: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNetwork: (networkKey: string) => Promise<void>;
  addCustomToken: (tokenAddress: string) => Promise<void>;
  removeCustomToken: (tokenAddress: string) => void;
  loadCustomTokens: () => void;
  validateToken: (tokenAddress: string) => Promise<TokenInfo>;
  validateMnemonic: (mnemonic: string) => boolean;
  sendEther: (to: string, amount: string) => Promise<string>;
  sendToken: (
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number,
  ) => Promise<string>;
  getSwapQuote: (
    fromToken: string,
    toToken: string,
    amount: string,
    decimals: number,
  ) => Promise<{
    toAmount: string;
    estimatedGas: string;
    protocols: any[];
    price: string;
    priceImpact: string;
  }>;
  executeSwap: (
    fromToken: string,
    toToken: string,
    amount: string,
    decimals: number,
    slippage?: number,
  ) => Promise<string>;
  estimateGas: (transaction: TransactionRequest) => Promise<string>;
  getTransactionHistory: () => Promise<any[]>;
  transactionHistory: any[];
  saveState: () => void;
  restoreState: () => void;
  clearPersistedState: () => void;
}

const useAppStore = create<AppStore>((set, get) => ({
  wallet: {
    address: '',
    balance: 0,
    ethBalance: '0',
    connected: false,
    chainId: undefined,
    type: null,
    canSign: false,
  },
  portfolio: {
    totalValue: 0,
    ethValue: 0,
    assets: [],
    pnl24h: 0,
  },
  selectedAsset: null,
  trades: [],
  cryptoPrices: [],
  customTokens: [],
  mnemonicWallet: null,
  privateKeyWallet: null,
  transactionHistory: [],
  isLoading: false,
  error: null,
  currentNetwork: 'ethereum',
  availableNetworks: web3Service.getAvailableNetworks(),

  validateMnemonic: (mnemonic: string): boolean => {
    return web3Service.validateMnemonic(mnemonic);
  },

  validatePrivateKey: (privateKey: string): boolean => {
    return web3Service.validatePrivateKey(privateKey);
  },

  connectWithMnemonic: async (mnemonic: string, networkKey?: string) => {
    set({ isLoading: true, error: null });

    try {
      const network = networkKey || get().currentNetwork;
      const result = await web3Service.connectWithMnemonic(mnemonic, network);
      const mnemonicWalletInfo = web3Service.getMnemonicWalletInfo();

      set({
        wallet: {
          address: result.address,
          balance: 0,
          ethBalance: '0',
          connected: true,
          chainId: result.chainId,
          type: 'mnemonic',
          canSign: result.canSign,
        },
        mnemonicWallet: mnemonicWalletInfo,
        currentNetwork: network,
        isLoading: false,
      });

      // Load custom tokens and balances
      get().loadCustomTokens();
      await get().refreshBalances();
      await get().loadCryptoPrices();

      // Save state after successful connection
      get().saveState();
    } catch (error) {
      console.error('Failed to connect with mnemonic:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect with mnemonic',
        isLoading: false,
      });
    }
  },

  connectWithPrivateKey: async (privateKey: string, networkKey?: string) => {
    set({ isLoading: true, error: null });

    try {
      const network = networkKey || get().currentNetwork;
      const result = await web3Service.connectWithPrivateKey(
        privateKey,
        network,
      );
      const privateKeyWalletInfo = web3Service.getPrivateKeyWalletInfo();

      set({
        wallet: {
          address: result.address,
          balance: 0,
          ethBalance: '0',
          connected: true,
          chainId: result.chainId,
          type: 'privateKey',
          canSign: result.canSign,
        },
        privateKeyWallet: privateKeyWalletInfo,
        mnemonicWallet: null, // Clear mnemonic wallet if any
        currentNetwork: network,
        isLoading: false,
      });

      // Load custom tokens and balances
      get().loadCustomTokens();
      await get().refreshBalances();
      await get().loadCryptoPrices();

      // Save state after successful connection
      get().saveState();
    } catch (error) {
      console.error('Failed to connect with private key:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect with private key',
        isLoading: false,
      });
    }
  },

  sendEther: async (to: string, amount: string): Promise<string> => {
    const { wallet } = get();

    if (!wallet.connected || !wallet.canSign) {
      throw new Error('Wallet not connected or cannot sign transactions');
    }

    if (wallet.type !== 'mnemonic') {
      throw new Error('Only mnemonic wallets support sending transactions');
    }

    set({ isLoading: true, error: null });

    try {
      const txHash = await web3Service.sendEther(to, amount);

      // Add transaction to history
      get().addTrade({
        symbol: 'ETH',
        type: 'sell',
        amount: parseFloat(amount),
        price: 0, // Would need to fetch current price
        status: 'pending',
        txHash,
        fromToken: 'ETH',
        toToken: 'ETH',
      });

      // Refresh balances after transaction
      await get().refreshBalances();

      set({ isLoading: false });
      return txHash;
    } catch (error) {
      console.error('Failed to send ether:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to send ether',
        isLoading: false,
      });
      throw error;
    }
  },

  sendToken: async (
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number,
  ): Promise<string> => {
    const { wallet } = get();

    if (!wallet.connected || !wallet.canSign) {
      throw new Error('Wallet not connected or cannot sign transactions');
    }

    if (wallet.type !== 'mnemonic') {
      throw new Error('Only mnemonic wallets support sending transactions');
    }

    set({ isLoading: true, error: null });

    try {
      const txHash = await web3Service.sendToken(
        tokenAddress,
        to,
        amount,
        decimals,
      );

      // Add transaction to history
      get().addTrade({
        symbol: 'TOKEN',
        type: 'sell',
        amount: parseFloat(amount),
        price: 0, // Would need to fetch current price
        status: 'pending',
        txHash,
        fromToken: tokenAddress,
        toToken: tokenAddress,
      });

      // Refresh balances after transaction
      await get().refreshBalances();

      set({ isLoading: false });
      return txHash;
    } catch (error) {
      console.error('Failed to send token:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to send token',
        isLoading: false,
      });
      throw error;
    }
  },

  getSwapQuote: async (
    fromToken: string,
    toToken: string,
    amount: string,
    decimals: number,
  ): Promise<{
    toAmount: string;
    estimatedGas: string;
    protocols: any[];
    price: string;
    priceImpact: string;
  }> => {
    const { wallet } = get();

    if (!wallet.connected || !wallet.canSign) {
      throw new Error('Wallet not connected or cannot sign transactions');
    }

    if (wallet.type !== 'mnemonic') {
      throw new Error('Only mnemonic wallets support sending transactions');
    }

    set({ isLoading: true, error: null });

    try {
      const quote = await web3Service.getSwapQuote(
        fromToken,
        toToken,
        amount,
        decimals,
      );
      set({ isLoading: false });
      return quote;
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to get swap quote',
        isLoading: false,
      });
      throw error;
    }
  },

  executeSwap: async (
    fromToken: string,
    toToken: string,
    amount: string,
    decimals: number,
    slippage?: number,
  ): Promise<string> => {
    const { wallet } = get();

    if (!wallet.connected || !wallet.canSign) {
      throw new Error('Wallet not connected or cannot sign transactions');
    }

    if (wallet.type !== 'mnemonic') {
      throw new Error('Only mnemonic wallets support sending transactions');
    }

    set({ isLoading: true, error: null });

    try {
      const txHash = await web3Service.executeSwap(
        fromToken,
        toToken,
        amount,
        decimals,
        slippage,
      );
      set({ isLoading: false });
      return txHash;
    } catch (error) {
      console.error('Failed to execute swap:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to execute swap',
        isLoading: false,
      });
      throw error;
    }
  },

  estimateGas: async (transaction: TransactionRequest): Promise<string> => {
    const { wallet } = get();

    if (!wallet.connected || !wallet.canSign) {
      throw new Error('Wallet not connected or cannot sign transactions');
    }

    try {
      return await web3Service.estimateGas(transaction);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  },

  getTransactionHistory: async (): Promise<any[]> => {
    const { wallet, currentNetwork } = get();
    if (!wallet.connected || !wallet.address) {
      return [];
    }

    try {
      const history = await web3Service.getTransactionHistory(
        wallet.address,
        currentNetwork,
        50,
      );
      set({ transactionHistory: history });
      return history;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  },

  setNetwork: async (networkKey: string) => {
    try {
      const { wallet } = get();

      if (wallet.connected && wallet.address) {
        // Switch network while keeping wallet connected
        set({ isLoading: true });
        const result = await web3Service.switchNetwork(networkKey);

        set({
          currentNetwork: networkKey,
          wallet: {
            ...wallet,
            chainId: result.chainId,
          },
          isLoading: false,
        });
      } else {
        // Just switch network without wallet
        web3Service.setNetwork(networkKey);
        set({ currentNetwork: networkKey });
      }

      // Load custom tokens for the new network
      get().loadCustomTokens();

      // Refresh balances for new network if wallet is connected
      if (wallet.connected && wallet.address) {
        await get().refreshBalances();
        await get().loadCryptoPrices();
      }

      // Save network selection
      get().saveState();
    } catch (error) {
      console.error('Failed to set network:', error);
      set({
        error: 'Failed to switch network',
        isLoading: false,
      });
    }
  },

  loadCustomTokens: () => {
    const { currentNetwork } = get();
    const customTokens = web3Service.getCustomTokens(currentNetwork);
    set({ customTokens });
  },

  validateToken: async (tokenAddress: string): Promise<TokenInfo> => {
    const { currentNetwork } = get();
    return web3Service.validateTokenContract(tokenAddress, currentNetwork);
  },

  addCustomToken: async (tokenAddress: string) => {
    set({ isLoading: true, error: null });

    try {
      const { currentNetwork } = get();
      const customToken = await web3Service.addCustomToken(
        tokenAddress,
        currentNetwork,
      );

      // Update the store with the new token
      const currentTokens = get().customTokens;
      const existingIndex = currentTokens.findIndex(
        (t) => t.address.toLowerCase() === customToken.address.toLowerCase(),
      );

      if (existingIndex >= 0) {
        // Update existing token
        currentTokens[existingIndex] = customToken;
        set({ customTokens: [...currentTokens] });
      } else {
        // Add new token
        set({ customTokens: [...currentTokens, customToken] });
      }

      // Refresh balances to include the new token
      const { wallet } = get();
      if (wallet.connected && wallet.address) {
        await get().refreshBalances();
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to add custom token:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to add custom token',
        isLoading: false,
      });
    }
  },

  removeCustomToken: (tokenAddress: string) => {
    try {
      const { currentNetwork, customTokens } = get();

      // Remove from web3Service storage
      web3Service.removeCustomToken(tokenAddress, currentNetwork);

      // Update the store
      const filteredTokens = customTokens.filter(
        (t) => t.address.toLowerCase() !== tokenAddress.toLowerCase(),
      );
      set({ customTokens: filteredTokens });

      // Refresh balances to remove the token
      const { wallet } = get();
      if (wallet.connected && wallet.address) {
        get().refreshBalances();
      }
    } catch (error) {
      console.error('Failed to remove custom token:', error);
      set({ error: 'Failed to remove custom token' });
    }
  },

  disconnectWallet: () => {
    web3Service.disconnect();

    // Clear persisted wallet state
    persistence.remove('wallet_state');

    set({
      wallet: {
        address: '',
        balance: 0,
        ethBalance: '0',
        connected: false,
        chainId: undefined,
        type: null,
        canSign: false,
      },
      portfolio: {
        totalValue: 0,
        ethValue: 0,
        assets: [],
        pnl24h: 0,
      },
      selectedAsset: null,
      trades: [],
      customTokens: [],
      mnemonicWallet: null,
      privateKeyWallet: null,
      error: null,
    });
  },

  updateBalance: (balance: number) => {
    set((state) => ({
      wallet: { ...state.wallet, balance },
    }));
  },

  updateETHBalance: (ethBalance: string) => {
    set((state) => ({
      wallet: { ...state.wallet, ethBalance },
    }));
  },

  setSelectedAsset: (asset: CryptoAsset | null) => {
    set({ selectedAsset: asset });

    // Save selected asset preference
    if (asset) {
      persistence.saveUserPreferences({
        selectedAssetId: asset.id,
      });
    }
  },

  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => {
    const newTrade: Trade = {
      ...trade,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    set((state) => ({
      trades: [newTrade, ...state.trades],
    }));
  },

  updatePortfolio: (portfolio: Portfolio) => {
    set({ portfolio });
  },

  loadCryptoPrices: async () => {
    try {
      const prices = await priceService.getPrices();
      const cryptoPrices: CryptoAsset[] = prices.map((price) => ({
        id: price.id,
        symbol: price.symbol,
        name: price.name,
        price: price.current_price,
        change24h: price.price_change_percentage_24h,
      }));
      set({ cryptoPrices });
    } catch (error) {
      console.error('Failed to load crypto prices:', error);
      set({ error: 'Failed to load crypto prices' });
    }
  },

  refreshBalances: async () => {
    const { wallet, currentNetwork } = get();
    if (!wallet.connected || !wallet.address) return;

    set({ isLoading: true });

    try {
      const tokenBalances = await web3Service.getAllTokenBalances(
        wallet.address,
        currentNetwork,
      );

      const prices = await priceService.getPrices();
      const priceMap = new Map(
        prices.map((price) => [
          price.symbol.toUpperCase(),
          price.current_price,
        ]),
      );

      const assets: CryptoAsset[] = tokenBalances.map((token) => {
        const price = priceMap.get(token.symbol.toUpperCase()) || 0;
        const balance = parseFloat(token.balance);
        const value = balance * price;

        return {
          id: token.symbol.toLowerCase(),
          symbol: token.symbol,
          name: token.name,
          price,
          change24h: 0, // Would need historical data
          balance,
          value,
          address: token.address,
        };
      });

      const totalValue = assets.reduce(
        (sum, asset) => sum + (asset.value || 0),
        0,
      );
      const ethAsset = assets.find(
        (a) => a.symbol === 'ETH' || a.symbol === 'BNB',
      );
      const ethValue = ethAsset?.value || 0;

      // Convert CryptoPrice[] to CryptoAsset[]
      const cryptoPrices: CryptoAsset[] = prices.map((price) => ({
        id: price.id,
        symbol: price.symbol,
        name: price.name,
        price: price.current_price,
        change24h: price.price_change_percentage_24h,
      }));

      set({
        portfolio: {
          totalValue,
          ethValue,
          assets,
          pnl24h: 0, // Would need historical data
        },
        cryptoPrices,
        isLoading: false,
      });

      // Update wallet balance
      if (ethAsset) {
        set((state) => ({
          wallet: {
            ...state.wallet,
            balance: totalValue,
            ethBalance: ethAsset.balance?.toString() || '0',
          },
        }));
      }
    } catch (error) {
      console.error('Failed to refresh balances:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to refresh balances',
        isLoading: false,
      });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  saveState: () => {
    const state = get();

    // Save current network
    persistence.saveNetworkSelection(state.currentNetwork);

    // Save wallet connection state (without sensitive data)
    if (state.wallet.connected) {
      const walletStateToSave = {
        address: state.wallet.address,
        connected: state.wallet.connected,
        chainId: state.wallet.chainId,
        type: state.wallet.type,
        canSign: state.wallet.canSign,
        // Note: We don't save mnemonic/private key for security
      };
      persistence.saveWalletState(walletStateToSave);
    }

    // Save user preferences like selected asset
    if (state.selectedAsset) {
      persistence.saveUserPreferences({
        selectedAssetId: state.selectedAsset.id,
      });
    }
  },

  restoreState: () => {
    // Restore network selection
    const savedNetwork = persistence.loadNetworkSelection();
    if (savedNetwork) {
      set({ currentNetwork: savedNetwork });
      web3Service.setNetwork(savedNetwork);
    }

    // Restore wallet state (but don't actually reconnect for security)
    const savedWalletState = persistence.loadWalletState();
    if (savedWalletState) {
      // Just restore the network and show a message that user was previously connected
      set({
        wallet: {
          address: '',
          balance: 0,
          ethBalance: '0',
          connected: false,
          chainId: undefined,
          type: null,
          canSign: false,
        },
        error: `Previous session restored. You were connected to ${savedWalletState.address?.substring(0, 8)}... Please reconnect your wallet.`,
      });

      // Clear the saved wallet state since we're not auto-reconnecting
      persistence.remove('wallet_state');
    }

    // Restore user preferences
    const savedPreferences = persistence.loadUserPreferences();
    if (savedPreferences?.selectedAssetId) {
      // We'll need to set selectedAsset after crypto prices are loaded
      const { cryptoPrices } = get();
      const asset = cryptoPrices.find(
        (a) => a.id === savedPreferences.selectedAssetId,
      );
      if (asset) {
        set({ selectedAsset: asset });
      }
    }
  },

  clearPersistedState: () => {
    persistence.clear();
  },
}));

export default useAppStore;
