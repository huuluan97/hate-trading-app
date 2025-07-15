import React, { useState } from 'react';
import { Card, Flex, Text, Badge, Table, IconButton } from '@radix-ui/themes';
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons';
import useAppStore from '../store';

export default function Portfolio() {
  const { portfolio, wallet } = useAppStore();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (
    text: string,
    addressType: string = 'wallet',
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(addressType);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedAddress(addressType);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  if (!wallet.connected) {
    return (
      <Card>
        <Flex direction="column" gap="3" p="4">
          <Text size="3" weight="medium">
            Portfolio
          </Text>
          <Text size="2" color="gray">
            Connect your wallet to view your portfolio
          </Text>
        </Flex>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Card>
      <Flex direction="column" gap="4" p="4">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold">
            Portfolio
          </Text>
          <Badge color={portfolio.pnl24h >= 0 ? 'green' : 'red'} variant="soft">
            {formatPercentage(portfolio.pnl24h)}
          </Badge>
        </Flex>

        <Flex direction="column" gap="2">
          <Text size="2" color="gray">
            Wallet Address
          </Text>
          <Flex align="center" gap="2">
            <Text
              size="2"
              style={{
                fontFamily: 'monospace',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {wallet.address}
            </Text>
            <IconButton
              size="1"
              variant="ghost"
              color={copiedAddress === 'wallet' ? 'green' : 'gray'}
              onClick={() => copyToClipboard(wallet.address, 'wallet')}
              style={{ cursor: 'pointer' }}
            >
              {copiedAddress === 'wallet' ? <CheckIcon /> : <CopyIcon />}
            </IconButton>
            {copiedAddress === 'wallet' && (
              <Text size="1" color="green">
                Copied!
              </Text>
            )}
          </Flex>
        </Flex>

        <Flex direction="column" gap="2">
          <Text size="2" color="gray">
            Total Value
          </Text>
          <Text size="5" weight="bold">
            {formatCurrency(portfolio.totalValue)}
          </Text>
        </Flex>

        {portfolio.assets.length > 0 ? (
          <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Asset</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    Contract Address
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Balance</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Price</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Value</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>24h</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {portfolio.assets.map((asset, index) => (
                  <Table.Row key={`${asset.symbol}-${asset.address || index}`}>
                    <Table.Cell>
                      <Flex direction="column">
                        <Text weight="medium">
                          {asset.symbol.toUpperCase()}
                        </Text>
                        <Text size="1" color="gray">
                          {asset.name}
                        </Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      {asset.address ? (
                        <Flex align="center" gap="1">
                          <Text
                            size="1"
                            style={{
                              fontFamily: 'monospace',
                              maxWidth: '100px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={asset.address}
                          >
                            {asset.address}
                          </Text>
                          <IconButton
                            size="1"
                            variant="ghost"
                            color={
                              copiedAddress === asset.address ? 'green' : 'gray'
                            }
                            onClick={() =>
                              copyToClipboard(
                                asset.address || '',
                                asset.address || '',
                              )
                            }
                            style={{ cursor: 'pointer' }}
                          >
                            {copiedAddress === asset.address ? (
                              <CheckIcon />
                            ) : (
                              <CopyIcon />
                            )}
                          </IconButton>
                          {copiedAddress === asset.address && (
                            <Text size="1" color="green">
                              Copied!
                            </Text>
                          )}
                        </Flex>
                      ) : (
                        <Text size="1" color="gray">
                          Native Token
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{asset.balance?.toFixed(6) || '0.000000'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{formatCurrency(asset.price || 0)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text weight="medium">
                        {formatCurrency(asset.value || 0)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={(asset.change24h || 0) >= 0 ? 'green' : 'red'}
                        variant="soft"
                        size="1"
                      >
                        {formatPercentage(asset.change24h || 0)}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>
        ) : (
          <Flex direction="column" gap="2" align="center" py="6">
            <Text size="2" color="gray">
              No assets found
            </Text>
            <Text size="1" color="gray">
              Start trading to see your portfolio
            </Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
