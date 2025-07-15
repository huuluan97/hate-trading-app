import React, { useEffect } from 'react';
import { Card, Flex, Text, Badge } from '@radix-ui/themes';
import useAppStore from '../store';

export default function PriceDisplay() {
  const { cryptoPrices, setSelectedAsset, selectedAsset, loadCryptoPrices } =
    useAppStore();

  useEffect(() => {
    // Load prices on mount and set up refresh interval
    loadCryptoPrices();

    const interval = setInterval(() => {
      loadCryptoPrices();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadCryptoPrices]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Card>
      <Flex direction="column" gap="3" p="4">
        <Text size="4" weight="bold">
          Live Market Prices
        </Text>

        <Flex direction="column" gap="2">
          {cryptoPrices.length > 0 ? (
            cryptoPrices.slice(0, 10).map((crypto) => (
              <Card
                key={crypto.id}
                variant={
                  selectedAsset?.id === crypto.id ? 'classic' : 'surface'
                }
                style={{ cursor: 'pointer' }}
              >
                <Flex
                  justify="between"
                  align="center"
                  p="3"
                  onClick={() => setSelectedAsset(crypto)}
                >
                  <Flex direction="column" gap="1">
                    <Text weight="medium">{crypto.symbol.toUpperCase()}</Text>
                    <Text size="1" color="gray">
                      {crypto.name}
                    </Text>
                  </Flex>

                  <Flex direction="column" align="end" gap="1">
                    <Text weight="bold">{formatCurrency(crypto.price)}</Text>
                    <Badge
                      color={crypto.change24h >= 0 ? 'green' : 'red'}
                      variant="soft"
                      size="1"
                    >
                      {formatPercentage(crypto.change24h)}
                    </Badge>
                  </Flex>
                </Flex>
              </Card>
            ))
          ) : (
            <Flex direction="column" gap="2" align="center" py="6">
              <Text size="2" color="gray">
                Loading prices...
              </Text>
            </Flex>
          )}
        </Flex>

        <Text size="1" color="gray" style={{ textAlign: 'center' }}>
          Real-time prices from CoinGecko • Updates every 30s
        </Text>
      </Flex>
    </Card>
  );
}
