import { ethers } from 'ethers';
import {
  NETWORKS,
  getNetworkInfo,
  getNetworkRpcUrls,
  getNetworkTokens,
} from '../constants/networks';
import type { NetworkInfo } from '../constants/networks/types';
import type {
  MnemonicWalletInfo,
  PrivateKeyWalletInfo,
  TransactionRequest,
} from '../types';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  formattedBalance: string;
  usdValue?: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply?: string;
  isValid: boolean;
  logo?: string;
  isCustom?: boolean;
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

class Web3Service {
  private providers: Record<string, ethers.JsonRpcProvider> = {};

  private currentNetwork: string = 'ethereum';

  private connectionRetryCount = 3;

  private connectionRetryDelay = 1000;

  private mnemonicWallet: ethers.HDNodeWallet | null = null;

  private privateKeyWallet: ethers.Wallet | null = null;

  private signer: ethers.Signer | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    Object.keys(NETWORKS).forEach((networkKey) => {
      const rpcUrls = getNetworkRpcUrls(networkKey);
      this.providers[networkKey] = this.createProvider(rpcUrls);
    });
  }

  private createProvider(rpcUrls: string[]): ethers.JsonRpcProvider {
    const provider = new ethers.JsonRpcProvider(rpcUrls[0]);
    const retryDelay = this.connectionRetryDelay;

    const originalSend = provider.send;
    provider.send = async function (
      method: string,
      params: any[],
    ): Promise<any> {
      for (let i = 0; i < rpcUrls.length; i += 1) {
        try {
          if (i > 0) {
            (this as any).url = rpcUrls[i];
          }
          return await originalSend.call(this, method, params);
        } catch (error) {
          console.warn(`RPC ${rpcUrls[i]} failed for ${method}:`, error);
          if (i === rpcUrls.length - 1) {
            throw error;
          }
          // Add delay between retries
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
      throw new Error('All RPC endpoints failed');
    };

    return provider;
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = this.connectionRetryCount,
    delay: number = this.connectionRetryDelay,
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < retries; i += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (i === retries - 1) {
          throw lastError;
        }
        console.warn(
          `Operation failed, retrying... (${i + 1}/${retries})`,
          error,
        );
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
    throw lastError!;
  }

  async validateTokenContract(
    tokenAddress: string,
    networkKey?: string,
  ): Promise<TokenInfo> {
    try {
      const provider = this.getProvider(networkKey);

      // Clean and validate the address
      const cleanAddress = tokenAddress.trim();
      if (!ethers.isAddress(cleanAddress)) {
        throw new Error('Invalid token address format');
      }

      // Get the checksummed address
      const checksummedAddress = ethers.getAddress(cleanAddress);
      const contract = new ethers.Contract(
        checksummedAddress,
        ERC20_ABI,
        provider,
      );

      // Check if contract exists
      const code = await provider.getCode(checksummedAddress);
      if (code === '0x') {
        throw new Error('No contract found at this address');
      }

      // Validate token contract by checking for required ERC20 functions
      const [symbol, name, decimals, totalSupply] = await Promise.all([
        contract.symbol().catch(() => ''),
        contract.name().catch(() => ''),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => '0'),
      ]);

      if (!symbol || !name) {
        throw new Error('Invalid ERC20 token contract');
      }

      return {
        address: checksummedAddress,
        symbol,
        name,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        isValid: true,
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        address: tokenAddress,
        symbol: '',
        name: '',
        decimals: 0,
        totalSupply: '0',
        isValid: false,
      };
    }
  }

  async addCustomToken(
    tokenAddress: string,
    networkKey?: string,
  ): Promise<CustomToken> {
    const network = networkKey || this.currentNetwork;
    const tokenInfo = await this.validateTokenContract(tokenAddress, network);

    if (!tokenInfo.isValid) {
      throw new Error('Invalid token contract');
    }

    const customToken: CustomToken = {
      address: tokenInfo.address,
      symbol: tokenInfo.symbol,
      name: tokenInfo.name,
      decimals: tokenInfo.decimals,
      networkKey: network,
      addedAt: Date.now(),
    };

    // Save to localStorage
    this.saveCustomToken(customToken);

    return customToken;
  }

  private saveCustomToken(token: CustomToken): void {
    const storageKey = `custom_tokens_${token.networkKey}`;
    const existingTokens = this.getCustomTokens(token.networkKey);

    // Check if token already exists
    const existingIndex = existingTokens.findIndex(
      (t) => t.address.toLowerCase() === token.address.toLowerCase(),
    );

    if (existingIndex >= 0) {
      // Update existing token
      existingTokens[existingIndex] = token;
    } else {
      // Add new token
      existingTokens.push(token);
    }

    localStorage.setItem(storageKey, JSON.stringify(existingTokens));
  }

  getCustomTokens(networkKey?: string): CustomToken[] {
    const network = networkKey || this.currentNetwork;
    const storageKey = `custom_tokens_${network}`;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse custom tokens:', error);
      return [];
    }
  }

  removeCustomToken(tokenAddress: string, networkKey?: string): void {
    const network = networkKey || this.currentNetwork;
    const storageKey = `custom_tokens_${network}`;
    const existingTokens = this.getCustomTokens(network);

    const filteredTokens = existingTokens.filter(
      (t) => t.address.toLowerCase() !== tokenAddress.toLowerCase(),
    );

    localStorage.setItem(storageKey, JSON.stringify(filteredTokens));
  }

  getAllTokens(networkKey?: string): Record<string, any> {
    const network = networkKey || this.currentNetwork;
    const networkTokens = getNetworkTokens(network);
    const customTokens = this.getCustomTokens(network);

    // Combine network tokens with custom tokens
    const allTokens = { ...networkTokens };

    customTokens.forEach((token) => {
      allTokens[token.symbol] = {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logo: token.logo,
      };
    });

    return allTokens;
  }

  getCurrentNetwork(): NetworkInfo {
    return getNetworkInfo(this.currentNetwork);
  }

  setNetwork(networkKey: string): void {
    if (NETWORKS[networkKey]) {
      this.currentNetwork = networkKey;
    } else {
      throw new Error(`Network ${networkKey} not supported`);
    }
  }

  getAvailableNetworks(): Record<string, NetworkInfo> {
    return NETWORKS;
  }

  private getProvider(networkKey?: string): ethers.JsonRpcProvider {
    const network = networkKey || this.currentNetwork;
    return this.providers[network];
  }

  validateMnemonic(mnemonic: string): boolean {
    try {
      const trimmedMnemonic = mnemonic.trim().toLowerCase();
      const words = trimmedMnemonic.split(/\s+/);

      if (words.length !== 12 && words.length !== 24) {
        return false;
      }

      // Try to create a wallet from the mnemonic
      ethers.Mnemonic.fromPhrase(trimmedMnemonic);
      return true;
    } catch (error) {
      console.error('Invalid mnemonic:', error);
      return false;
    }
  }

  async connectWithMnemonic(
    mnemonic: string,
    networkKey?: string,
  ): Promise<{
    address: string;
    chainId: number;
    network: NetworkInfo;
    canSign: boolean;
  }> {
    return this.retryOperation(async () => {
      const network = networkKey || this.currentNetwork;
      const provider = this.getProvider(network);
      const networkInfo = getNetworkInfo(network);

      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      try {
        const trimmedMnemonic = mnemonic.trim().toLowerCase();

        // Create wallet from mnemonic
        const wallet = ethers.Wallet.fromPhrase(trimmedMnemonic);
        this.mnemonicWallet = wallet;

        // Connect to provider
        this.signer = wallet.connect(provider);

        const chainInfo = await provider.getNetwork();
        const expectedChainId = networkInfo.chainId;

        if (Number(chainInfo.chainId) !== expectedChainId) {
          console.warn(
            `Network mismatch: expected ${expectedChainId}, got ${chainInfo.chainId}`,
          );
        }

        return {
          address: wallet.address,
          chainId: Number(chainInfo.chainId),
          network: networkInfo,
          canSign: true,
        };
      } catch (error) {
        console.error('Failed to create wallet from mnemonic:', error);
        throw new Error('Failed to create wallet from mnemonic phrase');
      }
    });
  }

  getMnemonicWalletInfo(): MnemonicWalletInfo | null {
    if (!this.mnemonicWallet) {
      return null;
    }

    return {
      address: this.mnemonicWallet.address,
      mnemonic: this.mnemonicWallet.mnemonic?.phrase || '',
      privateKey: this.mnemonicWallet.privateKey,
      publicKey: this.mnemonicWallet.publicKey,
      path: this.mnemonicWallet.path || "m/44'/60'/0'/0/0",
    };
  }

  validatePrivateKey(privateKey: string): boolean {
    try {
      const cleanPrivateKey = privateKey.trim();

      // Check if it's a valid hex string with proper length
      if (!/^(0x)?[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
        return false;
      }

      // Try to create a wallet from the private key
      const testWallet = new ethers.Wallet(cleanPrivateKey);
      return Boolean(testWallet.address);
    } catch (error) {
      console.error('Invalid private key:', error);
      return false;
    }
  }

  async connectWithPrivateKey(
    privateKey: string,
    networkKey?: string,
  ): Promise<{
    address: string;
    chainId: number;
    network: NetworkInfo;
    canSign: boolean;
  }> {
    return this.retryOperation(async () => {
      const network = networkKey || this.currentNetwork;
      const provider = this.getProvider(network);
      const networkInfo = getNetworkInfo(network);

      if (!this.validatePrivateKey(privateKey)) {
        throw new Error('Invalid private key');
      }

      try {
        const cleanPrivateKey = privateKey.trim();

        // Create wallet from private key
        const wallet = new ethers.Wallet(cleanPrivateKey);
        this.privateKeyWallet = wallet;
        this.mnemonicWallet = null; // Clear mnemonic wallet if any

        // Connect to provider
        this.signer = wallet.connect(provider);

        const chainInfo = await provider.getNetwork();
        const expectedChainId = networkInfo.chainId;

        if (Number(chainInfo.chainId) !== expectedChainId) {
          console.warn(
            `Network mismatch: expected ${expectedChainId}, got ${chainInfo.chainId}`,
          );
        }

        return {
          address: wallet.address,
          chainId: Number(chainInfo.chainId),
          network: networkInfo,
          canSign: true,
        };
      } catch (error) {
        console.error('Failed to create wallet from private key:', error);
        throw new Error('Failed to create wallet from private key');
      }
    });
  }

  getPrivateKeyWalletInfo(): PrivateKeyWalletInfo | null {
    if (!this.privateKeyWallet) {
      return null;
    }

    return {
      address: this.privateKeyWallet.address,
      privateKey: this.privateKeyWallet.privateKey,
      publicKey: this.privateKeyWallet.signingKey.publicKey,
    };
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error('No wallet connected for signing');
    }

    if (!this.mnemonicWallet && !this.privateKeyWallet) {
      throw new Error('No wallet available for signing');
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: transaction.to,
        value: transaction.value || '0',
        data: transaction.data || '0x',
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice,
        nonce: transaction.nonce,
      });

      return tx.hash;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw new Error('Failed to sign and send transaction');
    }
  }

  async sendEther(to: string, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('No wallet connected for sending');
    }

    try {
      const value = ethers.parseEther(amount);
      const tx = await this.signer.sendTransaction({
        to,
        value,
      });

      return tx.hash;
    } catch (error) {
      console.error('Send ether failed:', error);
      throw new Error('Failed to send ether');
    }
  }

  async sendToken(
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number,
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('No wallet connected for sending');
    }

    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.signer,
      );

      const value = ethers.parseUnits(amount, decimals);
      const tx = await tokenContract.transfer(to, value);

      return tx.hash;
    } catch (error) {
      console.error('Send token failed:', error);
      throw new Error('Failed to send token');
    }
  }

  async estimateGas(transaction: TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error('No wallet connected for gas estimation');
    }

    try {
      const gasLimit = await this.signer.estimateGas({
        to: transaction.to,
        value: transaction.value || '0',
        data: transaction.data || '0x',
      });

      return gasLimit.toString();
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  canSign(): boolean {
    return this.mnemonicWallet !== null && this.signer !== null;
  }

  clearMnemonicWallet(): void {
    this.mnemonicWallet = null;
    this.signer = null;
  }

  async getNativeBalance(
    address: string,
    networkKey?: string,
  ): Promise<string> {
    return this.retryOperation(async () => {
      const provider = this.getProvider(networkKey);
      const checksummedAddress = ethers.getAddress(address);
      const balance = await provider.getBalance(checksummedAddress);
      return ethers.formatEther(balance);
    });
  }

  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    networkKey?: string,
  ): Promise<string> {
    return this.retryOperation(async () => {
      const provider = this.getProvider(networkKey);

      if (tokenAddress === ethers.ZeroAddress) {
        return this.getNativeBalance(walletAddress, networkKey);
      }

      // Ensure proper address checksumming
      const checksummedTokenAddress = ethers.getAddress(tokenAddress);
      const checksummedWalletAddress = ethers.getAddress(walletAddress);

      const contract = new ethers.Contract(
        checksummedTokenAddress,
        ERC20_ABI,
        provider,
      );
      const balance = await contract.balanceOf(checksummedWalletAddress);
      const decimals = await contract.decimals();

      return ethers.formatUnits(balance, decimals);
    });
  }

  async getAllTokenBalances(
    walletAddress: string,
    networkKey?: string,
  ): Promise<TokenBalance[]> {
    const allTokens = this.getAllTokens(networkKey || this.currentNetwork);

    const tokenEntries = Object.entries(allTokens);
    const balancePromises = tokenEntries.map(async ([symbol, token]) => {
      try {
        const balance = await this.getTokenBalance(
          token.address,
          walletAddress,
          networkKey,
        );

        const formattedBalance = parseFloat(balance).toFixed(6);

        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          balance,
          decimals: token.decimals,
          formattedBalance,
        };
      } catch (balanceError) {
        console.error(`Error fetching ${symbol} balance:`, balanceError);
        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          balance: '0',
          decimals: token.decimals,
          formattedBalance: '0.000000',
        };
      }
    });

    const balances = await Promise.all(balancePromises);
    return balances;
  }

  getConnectionInstructions(): string {
    return `
      For wallet connection:
      1. Enter your 12-word seed phrase
      2. Select your preferred network
      3. Add custom tokens using contract addresses
      4. Send transactions and trade tokens

      Note: Your seed phrase enables full transaction signing capabilities.
    `;
  }

  async switchNetwork(networkKey: string): Promise<{
    chainId: number;
    network: NetworkInfo;
  }> {
    if (!this.mnemonicWallet && !this.privateKeyWallet) {
      throw new Error('No wallet connected');
    }

    const networkInfo = getNetworkInfo(networkKey);
    const provider = this.getProvider(networkKey);

    // Update current network
    this.currentNetwork = networkKey;

    // Reconnect the signer with the new provider
    if (this.mnemonicWallet) {
      this.signer = this.mnemonicWallet.connect(provider);
    } else if (this.privateKeyWallet) {
      this.signer = this.privateKeyWallet.connect(provider);
    }

    const chainInfo = await provider.getNetwork();
    const expectedChainId = networkInfo.chainId;

    if (Number(chainInfo.chainId) !== expectedChainId) {
      console.warn(
        `Network mismatch: expected ${expectedChainId}, got ${chainInfo.chainId}`,
      );
    }

    return {
      chainId: Number(chainInfo.chainId),
      network: networkInfo,
    };
  }

  disconnect(): void {
    this.clearMnemonicWallet();
    this.mnemonicWallet = null;
    this.privateKeyWallet = null;
    this.signer = null;
    Object.values(this.providers).forEach((provider) => {
      if (provider.destroy) {
        provider.destroy();
      }
    });
    this.providers = {};
    this.initializeProviders();
  }

  // Additional utility methods for network-specific operations
  getNetworkExplorerUrl(networkKey?: string): string {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.etherscanUrl;
  }

  getNetworkBridgeUrl(networkKey?: string): string {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.bridgeURL;
  }

  getNetworkNativeToken(networkKey?: string) {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.nativeToken;
  }

  getNetworkIcon(networkKey?: string): string {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.icon;
  }

  getMulticallAddress(networkKey?: string): string {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.multicall;
  }

  getAverageBlockTime(networkKey?: string): number {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.averageBlockTimeInSeconds;
  }

  // DEX-related methods for future trading functionality
  getUniswapV3RouterAddress(networkKey?: string): string {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.elastic.routers;
  }

  getUniswapV3FactoryAddress(networkKey?: string): string {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.elastic.coreFactory;
  }

  getUniswapV3QuoterAddress(networkKey?: string): string {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    return network.elastic.quoter;
  }

  // Swap functionality using 1inch API
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    decimals: number,
    networkKey?: string,
  ): Promise<{
    toAmount: string;
    estimatedGas: string;
    protocols: any[];
    price: string;
    priceImpact: string;
  }> {
    const network = getNetworkInfo(networkKey || this.currentNetwork);
    const chainId = parseInt(network.chainId.toString());

    // Map our chain IDs to 1inch supported chains
    const chainMapping: { [key: number]: number } = {
      1: 1, // Ethereum
      137: 137, // Polygon
      56: 56, // BSC
      42161: 42161, // Arbitrum
      10: 10, // Optimism
    };

    const oneInchChainId = chainMapping[chainId];
    if (!oneInchChainId) {
      throw new Error('Swap not supported on this network');
    }

    const amountWei = ethers.parseUnits(amount, decimals).toString();

    try {
      const response = await fetch(
        `https://api.1inch.dev/swap/v5.2/${oneInchChainId}/quote?src=${fromToken}&dst=${toToken}&amount=${amountWei}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get swap quote');
      }

      const data = await response.json();

      return {
        toAmount: data.toAmount,
        estimatedGas: data.estimatedGas,
        protocols: data.protocols || [],
        price: data.toAmount,
        priceImpact: '0', // 1inch doesn't provide this directly
      };
    } catch (error) {
      console.error('Swap quote failed:', error);
      throw new Error('Failed to get swap quote');
    }
  }

  async executeSwap(
    fromToken: string,
    toToken: string,
    amount: string,
    decimals: number,
    slippage: number = 1,
    networkKey?: string,
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('No wallet connected for swapping');
    }

    const network = getNetworkInfo(networkKey || this.currentNetwork);
    const chainId = parseInt(network.chainId.toString());

    const chainMapping: { [key: number]: number } = {
      1: 1, // Ethereum
      137: 137, // Polygon
      56: 56, // BSC
      42161: 42161, // Arbitrum
      10: 10, // Optimism
    };

    const oneInchChainId = chainMapping[chainId];
    if (!oneInchChainId) {
      throw new Error('Swap not supported on this network');
    }

    const amountWei = ethers.parseUnits(amount, decimals).toString();
    const walletAddress = await this.signer.getAddress();

    try {
      // First approve token if it's not ETH
      if (fromToken !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        const tokenContract = new ethers.Contract(
          fromToken,
          ERC20_ABI,
          this.signer,
        );

        const allowance = await tokenContract.allowance(
          walletAddress,
          '0x1111111254eeb25477b68fb85ed929f73a960582', // 1inch router
        );

        if (allowance < ethers.parseUnits(amount, decimals)) {
          const approveTx = await tokenContract.approve(
            '0x1111111254eeb25477b68fb85ed929f73a960582',
            ethers.parseUnits(amount, decimals),
          );
          await approveTx.wait();
        }
      }

      // Get swap transaction data
      const response = await fetch(
        `https://api.1inch.dev/swap/v5.2/${oneInchChainId}/swap?src=${fromToken}&dst=${toToken}&amount=${amountWei}&from=${walletAddress}&slippage=${slippage}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get swap transaction');
      }

      const swapData = await response.json();

      // Execute the swap
      const tx = await this.signer.sendTransaction({
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value || '0',
        gasLimit: swapData.tx.gas,
        gasPrice: swapData.tx.gasPrice,
      });

      return tx.hash;
    } catch (error) {
      console.error('Swap execution failed:', error);
      throw new Error('Failed to execute swap');
    }
  }

  // Get token pair price from DEX
  async getTokenPrice(
    tokenAddress: string,
    baseToken: string = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
  ): Promise<string> {
    try {
      const quote = await this.getSwapQuote(tokenAddress, baseToken, '1', 18);
      return ethers.formatUnits(quote.toAmount, 18);
    } catch (error) {
      console.error('Price fetch failed:', error);
      return '0';
    }
  }

  async getTransactionHistory(
    address: string,
    networkKey?: string,
    limit: number = 20,
  ): Promise<
    Array<{
      hash: string;
      blockNumber: number;
      timestamp: number;
      from: string;
      to: string;
      value: string;
      gasUsed: string;
      gasPrice: string;
      status: number;
      type: 'sent' | 'received' | 'contract';
      tokenSymbol?: string;
      tokenName?: string;
      tokenAmount?: string;
      tokenDecimals?: number;
    }>
  > {
    const provider = this.getProvider(networkKey);
    const checksumAddress = ethers.getAddress(address);

    try {
      // Get latest block number
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 1000); // Last 1000 blocks

      // Create filter for all transactions involving this address
      const filter = {
        fromBlock,
        toBlock: latestBlock,
        address: checksumAddress,
      };

      // Get transaction logs
      const logs = await provider.getLogs(filter);

      // Get regular transactions (sent/received)
      const transactions = [];

      // Process recent blocks to find transactions
      for (let i = 0; i < Math.min(100, latestBlock - fromBlock); i++) {
        const blockNumber = latestBlock - i;
        try {
          const block = await provider.getBlock(blockNumber, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && tx.hash) {
                const txObj = tx as any;
                if (
                  txObj.from === checksumAddress ||
                  txObj.to === checksumAddress
                ) {
                  const receipt = await provider.getTransactionReceipt(
                    txObj.hash,
                  );

                  let type: 'sent' | 'received' | 'contract' = 'contract';
                  if (txObj.from === checksumAddress) {
                    type = 'sent';
                  } else if (txObj.to === checksumAddress) {
                    type = 'received';
                  }

                  transactions.push({
                    hash: txObj.hash,
                    blockNumber: blockNumber,
                    timestamp: block.timestamp * 1000,
                    from: txObj.from,
                    to: txObj.to || '',
                    value: ethers.formatEther(txObj.value || '0'),
                    gasUsed: receipt?.gasUsed?.toString() || '0',
                    gasPrice: txObj.gasPrice?.toString() || '0',
                    status: receipt?.status || 0,
                    type,
                  });
                }
              }
            }
          }
        } catch (blockError) {
          console.warn(`Failed to process block ${blockNumber}:`, blockError);
        }

        if (transactions.length >= limit) break;
      }

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => b.timestamp - a.timestamp);

      return transactions.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  }
}

export default new Web3Service();
export { NetworkInfo } from '../constants/networks/types';
