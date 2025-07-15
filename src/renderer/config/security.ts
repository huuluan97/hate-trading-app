// Security Configuration for Wallet Management

export const SECURITY_CONFIG = {
  // Mnemonic wallet settings
  ENABLE_MNEMONIC_WALLET:
    process.env.REACT_APP_ENABLE_MNEMONIC_WALLET !== 'false',
  SHOW_MNEMONIC_WARNING:
    process.env.REACT_APP_MNEMONIC_STORAGE_WARNING !== 'false',

  // Transaction limits (in ETH)
  MAX_TRANSACTION_AMOUNT: 10,
  DAILY_TRANSACTION_LIMIT: 100,

  // Security measures
  CLEAR_MNEMONIC_ON_DISCONNECT: true,
  REQUIRE_CONFIRMATION_FOR_LARGE_AMOUNTS: true,
  CONFIRMATION_THRESHOLD: 1, // ETH

  // Network security
  REQUIRE_HTTPS: true,
  VALIDATE_CONTRACTS: true,

  // Development settings
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  LOG_TRANSACTIONS: process.env.NODE_ENV === 'development',
};

export const SECURITY_WARNINGS = {
  MNEMONIC_STORAGE: `
    ⚠️  SECURITY WARNING ⚠️

    Your 12-word seed phrase is stored temporarily in memory for transaction signing.

    Best Practices:
    • Only enter your seed phrase on trusted devices
    • Never share your seed phrase with anyone
    • Consider using a hardware wallet for large amounts
    • Always verify transaction details before signing
    • Keep your seed phrase backed up securely offline
  `,

  TRANSACTION_SIGNING: `
    🔒 TRANSACTION SIGNING ENABLED

    You can now send transactions using your imported wallet.

    Security Reminders:
    • Double-check recipient addresses
    • Verify amounts before confirming
    • Monitor your transaction history
    • Keep your app updated
  `,

  LARGE_TRANSACTION: `
    ⚠️  LARGE TRANSACTION WARNING ⚠️

    You are about to send a large amount of cryptocurrency.

    Please verify:
    • Recipient address is correct
    • Amount is as intended
    • Network fees are acceptable
    • You have sufficient balance
  `,
};

// Utility functions for security
export const securityUtils = {
  // Clear sensitive data from memory
  clearSensitiveData: (obj: any) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        if (
          key.toLowerCase().includes('mnemonic') ||
          key.toLowerCase().includes('private') ||
          key.toLowerCase().includes('seed')
        ) {
          delete obj[key];
        }
      });
    }
  },

  // Validate transaction parameters
  validateTransaction: (
    to: string,
    amount: string,
  ): { valid: boolean; error?: string } => {
    if (!to || !to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return { valid: false, error: 'Invalid recipient address' };
    }

    const amountNum = parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      return { valid: false, error: 'Invalid amount' };
    }

    if (amountNum > SECURITY_CONFIG.MAX_TRANSACTION_AMOUNT) {
      return {
        valid: false,
        error: `Amount exceeds maximum limit of ${SECURITY_CONFIG.MAX_TRANSACTION_AMOUNT} ETH`,
      };
    }

    return { valid: true };
  },

  // Check if transaction requires additional confirmation
  requiresConfirmation: (amount: string): boolean => {
    const amountNum = parseFloat(amount);
    return amountNum >= SECURITY_CONFIG.CONFIRMATION_THRESHOLD;
  },

  // Mask sensitive strings for logging
  maskSensitiveString: (str: string): string => {
    if (str.length <= 8) return '****';
    return `${str.substring(0, 4)}****${str.substring(str.length - 4)}`;
  },
};

// Environment-specific configurations
export const getSecurityConfig = () => {
  const config = { ...SECURITY_CONFIG };

  // Override settings based on environment
  if (process.env.NODE_ENV === 'production') {
    config.DEBUG_MODE = false;
    config.LOG_TRANSACTIONS = false;
  }

  return config;
};

export default SECURITY_CONFIG;
