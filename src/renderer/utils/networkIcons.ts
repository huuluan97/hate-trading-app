// Network icon fallbacks to avoid CORS issues
export const NETWORK_ICONS = {
  ethereum: {
    emoji: '⟠',
    color: '#627EEA',
    fallback: 'ETH',
  },
  arbitrum: {
    emoji: '🔷',
    color: '#28A0F0',
    fallback: 'ARB',
  },
  optimism: {
    emoji: '🔴',
    color: '#FF0420',
    fallback: 'OP',
  },
  bsc: {
    emoji: '🟡',
    color: '#F3BA2F',
    fallback: 'BSC',
  },
  polygon: {
    emoji: '🟣',
    color: '#8247E5',
    fallback: 'MATIC',
  },
};

export const getNetworkIcon = (networkKey: string): string => {
  const icon = NETWORK_ICONS[networkKey as keyof typeof NETWORK_ICONS];
  return icon ? icon.emoji : networkKey.charAt(0).toUpperCase();
};

export const getNetworkColor = (networkKey: string): string => {
  const icon = NETWORK_ICONS[networkKey as keyof typeof NETWORK_ICONS];
  return icon ? icon.color : '#666666';
};

export const getNetworkFallback = (networkKey: string): string => {
  const icon = NETWORK_ICONS[networkKey as keyof typeof NETWORK_ICONS];
  return icon ? icon.fallback : networkKey.charAt(0).toUpperCase();
};
