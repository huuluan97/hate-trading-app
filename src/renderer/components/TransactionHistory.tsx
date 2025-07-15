import React, { useState, useEffect, useCallback } from 'react';
import { Card, Flex, Text, Badge, Table, Button } from '@radix-ui/themes';
import { ExternalLinkIcon, ReloadIcon } from '@radix-ui/react-icons';
import useAppStore from '../store';

export default function TransactionHistory() {
  const {
    wallet,
    currentNetwork,
    availableNetworks,
    transactionHistory,
    getTransactionHistory,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  const loadTransactionHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      await getTransactionHistory();
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getTransactionHistory]);

  useEffect(() => {
    if (wallet.connected && wallet.address) {
      loadTransactionHistory();
    }
  }, [
    wallet.connected,
    wallet.address,
    currentNetwork,
    loadTransactionHistory,
  ]);

  const formatEther = (value: string) => {
    const numValue = parseFloat(value);
    if (numValue === 0) return '0';
    return numValue.toFixed(6);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? 'green' : 'red';
  };

  const getStatusText = (status: number) => {
    return status === 1 ? 'Success' : 'Failed';
  };

  const getTypeColor = (type: string) => {
    if (type === 'sent') return 'red';
    if (type === 'received') return 'green';
    return 'blue';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'sent') return '↗';
    if (type === 'received') return '↙';
    return '⚡';
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openInExplorer = (hash: string) => {
    const network = availableNetworks[currentNetwork];
    if (network?.etherscanUrl) {
      window.open(`${network.etherscanUrl}/tx/${hash}`, '_blank');
    }
  };

  if (!wallet.connected) {
    return (
      <Card>
        <Flex direction="column" gap="3" p="4">
          <Text size="3" weight="medium">
            Transaction History
          </Text>
          <Text size="2" color="gray">
            Connect your wallet to view transaction history
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="4" p="4">
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Text size="4" weight="bold">
              Transaction History
            </Text>
            <Badge variant="soft" size="1">
              {availableNetworks[currentNetwork]?.name}
            </Badge>
          </Flex>
          <Flex align="center" gap="2">
            <Text size="2" color="gray">
              {transactionHistory.length} transactions
            </Text>
            <Button
              size="1"
              variant="soft"
              onClick={loadTransactionHistory}
              disabled={isLoading}
            >
              <ReloadIcon />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </Flex>
        </Flex>

        {transactionHistory.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="2"
            py="8"
          >
            <Text size="2" color="gray">
              {isLoading ? 'Loading transactions...' : 'No transactions found'}
            </Text>
            <Text size="1" color="gray">
              Recent transactions will appear here
            </Text>
          </Flex>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Hash</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>From/To</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {transactionHistory.map((tx, index) => (
                <Table.Row key={tx.hash || index}>
                  <Table.Cell>
                    <Badge color={getTypeColor(tx.type)} size="1">
                      {getTypeIcon(tx.type)} {tx.type}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" style={{ fontFamily: 'monospace' }}>
                      {shortenAddress(tx.hash)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" style={{ fontFamily: 'monospace' }}>
                      {tx.type === 'sent'
                        ? `To: ${shortenAddress(tx.to)}`
                        : `From: ${shortenAddress(tx.from)}`}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      <Text size="1" weight="medium">
                        {formatEther(tx.value)} ETH
                      </Text>
                      {tx.tokenSymbol && (
                        <Text size="1" color="gray">
                          {tx.tokenAmount} {tx.tokenSymbol}
                        </Text>
                      )}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getStatusColor(tx.status)} size="1">
                      {getStatusText(tx.status)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1">{formatDate(tx.timestamp)}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="1"
                      variant="ghost"
                      onClick={() => openInExplorer(tx.hash)}
                    >
                      <ExternalLinkIcon />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Flex>
    </Card>
  );
}
