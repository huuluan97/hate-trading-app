import React from 'react';
import { Select, Flex, Text, Badge, Card, Box } from '@radix-ui/themes';
import useAppStore from '../store';
import web3Service from '../services/web3Service';
import { getNetworkIcon } from '../utils/networkIcons';

export default function NetworkSelector() {
  const { currentNetwork, availableNetworks, setNetwork, wallet } =
    useAppStore();

  const handleNetworkChange = (networkKey: string) => {
    setNetwork(networkKey);
  };

  const getCurrentNetworkInfo = () => {
    return availableNetworks[currentNetwork] || availableNetworks.ethereum;
  };

  const networkInfo = getCurrentNetworkInfo();

  return (
    <Card>
      <Flex direction="column" gap="3" p="3">
        <Flex align="center" gap="2">
          <Text size="3">{getNetworkIcon(currentNetwork)}</Text>
          <Text size="3" weight="medium">
            Network Selection
          </Text>
        </Flex>

        <Select.Root value={currentNetwork} onValueChange={handleNetworkChange}>
          <Select.Trigger />
          <Select.Content>
            {Object.entries(availableNetworks).map(([key, network]) => (
              <Select.Item key={key} value={key}>
                <Flex align="center" gap="2">
                  <Text size="2">{getNetworkIcon(key)}</Text>
                  <Text>{network.name}</Text>
                  <Badge variant="soft" size="1">
                    {network.nativeToken.symbol}
                  </Badge>
                </Flex>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        {/* Network Details */}
        <Box>
          <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Chain ID:
              </Text>
              <Text size="2" weight="medium">
                {networkInfo.chainId}
              </Text>
            </Flex>

            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Native Token:
              </Text>
              <Flex align="center" gap="1">
                <Text size="2">{getNetworkIcon(currentNetwork)}</Text>
                <Text size="2" weight="medium">
                  {networkInfo.nativeToken.symbol}
                </Text>
              </Flex>
            </Flex>

            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Block Time:
              </Text>
              <Text size="2" weight="medium">
                {networkInfo.averageBlockTimeInSeconds}s
              </Text>
            </Flex>

            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Tokens:
              </Text>
              <Text size="2" weight="medium">
                {Object.keys(networkInfo.tokens).length} configured
              </Text>
            </Flex>
          </Flex>
        </Box>

        {/* Network Status */}
        <Flex justify="between" align="center" pt="2">
          <Text size="2" color="gray">
            Status:
          </Text>
          <Badge color={wallet.connected ? 'green' : 'gray'}>
            {wallet.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </Flex>

        {/* Quick Actions */}
        <Flex gap="2" pt="2">
          <Badge
            variant="soft"
            size="1"
            style={{ cursor: 'pointer' }}
            onClick={() => window.open(networkInfo.etherscanUrl, '_blank')}
          >
            📊 Explorer
          </Badge>

          <Badge
            variant="soft"
            size="1"
            style={{ cursor: 'pointer' }}
            onClick={() => window.open(networkInfo.bridgeURL, '_blank')}
          >
            🌉 Bridge
          </Badge>

          <Badge
            variant="soft"
            size="1"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              const explorerUrl =
                web3Service.getNetworkExplorerUrl(currentNetwork);
              window.open(explorerUrl, '_blank');
            }}
          >
            🔍 View
          </Badge>
        </Flex>

        {/* Network Features */}
        <Box pt="2">
          <Text size="2" weight="medium" color="gray">
            Features:
          </Text>
          <Flex gap="1" pt="1" wrap="wrap">
            <Badge variant="soft" size="1">
              DEX Ready
            </Badge>
            <Badge variant="soft" size="1">
              Multi-RPC
            </Badge>
            <Badge variant="soft" size="1">
              Farming
            </Badge>
            <Badge variant="soft" size="1">
              Zap
            </Badge>
            {networkInfo.limitOrder !== null && (
              <Badge variant="soft" size="1">
                Limit Orders
              </Badge>
            )}
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
}
