import React, { useState, useEffect } from 'react';
import {
  Card,
  Flex,
  Text,
  Button,
  TextField,
  Badge,
  Tabs,
  Dialog,
  IconButton,
  Table,
  ScrollArea,
  Separator,
  AlertDialog,
  Select,
} from '@radix-ui/themes';
import { PlusIcon, TrashIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import { ethers } from 'ethers';
import useAppStore from '../store';
import { persistence } from '../utils/persistence';

export default function TradingInterface() {
  const [, setTradeType] = useState<'buy' | 'sell' | 'swap'>('swap');
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [sendType, setSendType] = useState<'eth' | 'token'>('eth');
  const [tokenAddress, setTokenAddress] = useState('');
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [showAddTokenDialog, setShowAddTokenDialog] = useState(false);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [tokenValidationResult, setTokenValidationResult] = useState<any>(null);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);

  // Swap states
  const [fromTokenAddress, setFromTokenAddress] = useState<string>('');
  const [toTokenAddress, setToTokenAddress] = useState<string>('');
  const [fromTokenDetails, setFromTokenDetails] = useState<any>(null);
  const [toTokenDetails, setToTokenDetails] = useState<any>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [slippage, setSlippage] = useState('1');
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);

  const {
    selectedAsset,
    wallet,
    setError,
    currentNetwork,
    customTokens,
    addCustomToken,
    removeCustomToken,
    validateToken,
    availableNetworks,
    portfolio,
    sendEther,
    sendToken,
    getSwapQuote,
    executeSwap,
  } = useAppStore();

  // Restore form inputs on component mount
  useEffect(() => {
    const savedInputs = persistence.loadFormInputs('TradingInterface');
    if (savedInputs) {
      if (savedInputs.amount) setAmount(savedInputs.amount);
      if (savedInputs.toAddress) setToAddress(savedInputs.toAddress);
      if (savedInputs.sendType) setSendType(savedInputs.sendType);
      if (savedInputs.tokenAddress) setTokenAddress(savedInputs.tokenAddress);
      if (savedInputs.slippage) setSlippage(savedInputs.slippage);
      if (savedInputs.swapAmount) setSwapAmount(savedInputs.swapAmount);
    }
  }, []);

  // Save form inputs when they change
  useEffect(() => {
    const inputsToSave = {
      amount,
      toAddress,
      sendType,
      tokenAddress,
      slippage,
      swapAmount,
    };
    persistence.saveFormInputs('TradingInterface', inputsToSave);
  }, [amount, toAddress, sendType, tokenAddress, slippage, swapAmount]);

  const handleETHTransfer = async () => {
    if (!wallet.canSign) {
      setError(
        'Transaction signing not available. Please connect with your 12-word seed phrase.',
      );
      return;
    }

    if (!toAddress.trim() || !amount.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const txHash = await sendEther(toAddress, amount);
      setError(null);
      setAmount('');
      setToAddress('');
      alert(`Transaction sent! Hash: ${txHash}`);
    } catch (error: any) {
      setError(error.message || 'Failed to send ETH');
    }
  };

  const handleTokenTransfer = async () => {
    if (!wallet.canSign) {
      setError(
        'Transaction signing not available. Please connect with your 12-word seed phrase.',
      );
      return;
    }

    if (!toAddress.trim() || !amount.trim() || !tokenDetails) {
      setError('Please fill in all fields and ensure token is valid');
      return;
    }

    try {
      const txHash = await sendToken(
        tokenAddress,
        toAddress,
        amount,
        tokenDetails.decimals,
      );
      setError(null);
      setAmount('');
      setToAddress('');
      alert(`Token transaction sent! Hash: ${txHash}`);
    } catch (error: any) {
      setError(error.message || 'Failed to send token');
    }
  };

  const validateTokenAddress = async (address: string) => {
    if (!address.trim() || address.length !== 42 || !address.startsWith('0x')) {
      setTokenDetails(null);
      return;
    }

    setIsValidatingToken(true);
    try {
      const tokenInfo = await validateToken(address);
      setTokenDetails(tokenInfo);
      setError(null);
    } catch (error: any) {
      setTokenDetails(null);
      setError(error.message || 'Invalid token address');
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Handle token address input with debouncing
  const handleTokenAddressChange = (address: string) => {
    setTokenAddress(address);
    setTokenDetails(null);

    // Clear previous timeout
    const timeoutId = setTimeout(() => {
      validateTokenAddress(address);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Swap functionality
  const validateSwapToken = async (address: string, isFromToken: boolean) => {
    if (!address.trim() || address.length !== 42 || !address.startsWith('0x')) {
      if (isFromToken) {
        setFromTokenDetails(null);
      } else {
        setToTokenDetails(null);
      }
      return;
    }

    setIsValidatingToken(true);
    try {
      const tokenInfo = await validateToken(address);
      if (isFromToken) {
        setFromTokenDetails(tokenInfo);
      } else {
        setToTokenDetails(tokenInfo);
      }
      setError(null);
    } catch (error: any) {
      if (isFromToken) {
        setFromTokenDetails(null);
      } else {
        setToTokenDetails(null);
      }
      setError(error.message || 'Invalid token address');
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleFromTokenChange = (address: string) => {
    setFromTokenAddress(address);
    setFromTokenDetails(null);
    setSwapQuote(null);

    const timeoutId = setTimeout(() => {
      validateSwapToken(address, true);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleToTokenChange = (address: string) => {
    setToTokenAddress(address);
    setToTokenDetails(null);
    setSwapQuote(null);

    const timeoutId = setTimeout(() => {
      validateSwapToken(address, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleGetSwapQuote = async () => {
    if (!fromTokenDetails || !toTokenDetails || !swapAmount) {
      setError('Please fill in all fields');
      return;
    }

    setIsGettingQuote(true);
    try {
      const quote = await getSwapQuote(
        fromTokenAddress,
        toTokenAddress,
        swapAmount,
        fromTokenDetails.decimals,
      );
      setSwapQuote(quote);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to get swap quote');
      setSwapQuote(null);
    } finally {
      setIsGettingQuote(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!fromTokenDetails || !toTokenDetails || !swapAmount || !swapQuote) {
      setError('Please get a quote first');
      return;
    }

    try {
      const txHash = await executeSwap(
        fromTokenAddress,
        toTokenAddress,
        swapAmount,
        fromTokenDetails.decimals,
        parseFloat(slippage),
      );
      setError(null);
      setSwapAmount('');
      setSwapQuote(null);
      alert(`Swap transaction sent! Hash: ${txHash}`);
    } catch (error: any) {
      setError(error.message || 'Failed to execute swap');
    }
  };

  const handleAddToken = async () => {
    if (!newTokenAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    try {
      setIsValidatingToken(true);
      setError(null);

      const validation = await validateToken(newTokenAddress.trim());
      setTokenValidationResult(validation);

      if (validation.isValid) {
        await addCustomToken(newTokenAddress.trim());
        setNewTokenAddress('');
        setShowAddTokenDialog(false);
        setTokenValidationResult(null);
      } else {
        setError(
          'Invalid token contract. Please check the address and try again.',
        );
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to validate token',
      );
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleValidateToken = async () => {
    if (!newTokenAddress.trim()) {
      setTokenValidationResult(null);
      return;
    }

    try {
      setIsValidatingToken(true);
      const validation = await validateToken(newTokenAddress.trim());
      setTokenValidationResult(validation);
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValidationResult({ isValid: false });
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleRemoveToken = (address: string) => {
    try {
      removeCustomToken(address);
      setTokenToDelete(null);
    } catch (error) {
      console.error('Failed to remove token:', error);
      setError('Failed to remove token');
    }
  };

  const getTokenBalance = (address: string) => {
    const asset = portfolio.assets.find(
      (a) => a.address?.toLowerCase() === address.toLowerCase(),
    );
    return asset?.balance || 0;
  };

  const getTokenValue = (address: string) => {
    const asset = portfolio.assets.find(
      (a) => a.address?.toLowerCase() === address.toLowerCase(),
    );
    return asset?.value || 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const calculateETHValue = () => {
    if (!amount || !selectedAsset) return 0;
    return parseFloat(amount) * selectedAsset.price;
  };

  const openInExplorer = (address: string) => {
    const explorerUrl = availableNetworks[currentNetwork]?.etherscanUrl;
    if (explorerUrl) {
      window.open(`${explorerUrl}/address/${address}`, '_blank');
    }
  };

  if (!wallet.connected) {
    return (
      <Card>
        <Flex direction="column" gap="3" p="4">
          <Text size="3" weight="medium">
            Trading & Token Management
          </Text>
          <Text size="2" color="gray">
            Connect your wallet to manage tokens and view trading options
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="4" p="4">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold">
            Trading Interface
          </Text>
          <Text size="2" color="gray">
            Network: {availableNetworks[currentNetwork]?.name}
          </Text>
        </Flex>

        <Tabs.Root
          defaultValue="tokens"
          onValueChange={(value) => setTradeType(value as any)}
        >
          <Tabs.List>
            <Tabs.Trigger value="tokens">Token Management</Tabs.Trigger>
            <Tabs.Trigger value="portfolio">Portfolio</Tabs.Trigger>
            <Tabs.Trigger value="send" disabled={!wallet.canSign}>
              Send
            </Tabs.Trigger>
            <Tabs.Trigger value="swap" disabled={!wallet.canSign}>
              Swap
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="tokens">
            <Flex direction="column" gap="4" pt="3">
              <Flex justify="between" align="center">
                <Text size="3" weight="medium">
                  Custom Tokens
                </Text>
                <Dialog.Root
                  open={showAddTokenDialog}
                  onOpenChange={setShowAddTokenDialog}
                >
                  <Dialog.Trigger>
                    <Button size="2" variant="outline">
                      <PlusIcon />
                      Add Token
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Content style={{ maxWidth: '500px' }}>
                    <Dialog.Title>Add Custom Token</Dialog.Title>
                    <Dialog.Description>
                      Enter the contract address of the token you want to add to
                      your wallet.
                    </Dialog.Description>

                    <Flex direction="column" gap="3" mt="4">
                      <Text size="2" weight="medium">
                        Token Contract Address
                      </Text>
                      <TextField.Root
                        placeholder="0x..."
                        value={newTokenAddress}
                        onChange={(e) => {
                          setNewTokenAddress(e.target.value);
                          setTokenValidationResult(null);
                        }}
                        onBlur={handleValidateToken}
                      />

                      {isValidatingToken && (
                        <Flex align="center" gap="2">
                          <Text size="2" color="gray">
                            Validating token...
                          </Text>
                        </Flex>
                      )}

                      {tokenValidationResult && (
                        <Card variant="surface" style={{ padding: '12px' }}>
                          {tokenValidationResult.isValid ? (
                            <Flex direction="column" gap="2">
                              <Text size="2" weight="medium" color="green">
                                ✓ Valid Token Found
                              </Text>
                              <Text size="2">
                                <strong>Name:</strong>{' '}
                                {tokenValidationResult.name}
                              </Text>
                              <Text size="2">
                                <strong>Symbol:</strong>{' '}
                                {tokenValidationResult.symbol}
                              </Text>
                              <Text size="2">
                                <strong>Decimals:</strong>{' '}
                                {tokenValidationResult.decimals}
                              </Text>
                              <Text size="2">
                                <strong>Total Supply:</strong>{' '}
                                {tokenValidationResult.totalSupply}
                              </Text>
                            </Flex>
                          ) : (
                            <Text size="2" color="red">
                              ✗ Invalid or non-existent token contract
                            </Text>
                          )}
                        </Card>
                      )}
                    </Flex>

                    <Flex gap="3" mt="4" justify="end">
                      <Dialog.Close>
                        <Button variant="soft" color="gray">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button
                        onClick={handleAddToken}
                        disabled={
                          !tokenValidationResult?.isValid || isValidatingToken
                        }
                      >
                        Add Token
                      </Button>
                    </Flex>
                  </Dialog.Content>
                </Dialog.Root>
              </Flex>

              <Card variant="surface">
                <ScrollArea style={{ maxHeight: '300px' }}>
                  {customTokens.length === 0 ? (
                    <Flex direction="column" align="center" gap="2" p="4">
                      <Text size="2" color="gray">
                        No custom tokens added yet
                      </Text>
                      <Text size="1" color="gray">
                        Click &quot;Add Token&quot; to add tokens by contract
                        address
                      </Text>
                    </Flex>
                  ) : (
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>Token</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>
                            Balance
                          </Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Value</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>
                            Actions
                          </Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {customTokens.map((token) => (
                          <Table.Row key={token.address}>
                            <Table.RowHeaderCell>
                              <Flex direction="column">
                                <Text size="2" weight="medium">
                                  {token.symbol}
                                </Text>
                                <Text size="1" color="gray">
                                  {token.name}
                                </Text>
                              </Flex>
                            </Table.RowHeaderCell>
                            <Table.Cell>
                              <Text size="2">
                                {getTokenBalance(token.address).toFixed(6)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text size="2">
                                {formatCurrency(getTokenValue(token.address))}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Flex gap="1">
                                <IconButton
                                  size="1"
                                  variant="ghost"
                                  onClick={() => openInExplorer(token.address)}
                                  title="View in explorer"
                                >
                                  <ExternalLinkIcon />
                                </IconButton>
                                <AlertDialog.Root
                                  open={tokenToDelete === token.address}
                                  onOpenChange={(open) =>
                                    !open && setTokenToDelete(null)
                                  }
                                >
                                  <AlertDialog.Trigger>
                                    <IconButton
                                      size="1"
                                      variant="ghost"
                                      color="red"
                                      onClick={() =>
                                        setTokenToDelete(token.address)
                                      }
                                      title="Remove token"
                                    >
                                      <TrashIcon />
                                    </IconButton>
                                  </AlertDialog.Trigger>
                                  <AlertDialog.Content
                                    style={{ maxWidth: '400px' }}
                                  >
                                    <AlertDialog.Title>
                                      Remove Token
                                    </AlertDialog.Title>
                                    <AlertDialog.Description>
                                      Are you sure you want to remove{' '}
                                      {token.symbol} ({token.name}) from your
                                      token list?
                                    </AlertDialog.Description>
                                    <Flex gap="3" mt="4" justify="end">
                                      <AlertDialog.Cancel>
                                        <Button variant="soft" color="gray">
                                          Cancel
                                        </Button>
                                      </AlertDialog.Cancel>
                                      <AlertDialog.Action>
                                        <Button
                                          variant="solid"
                                          color="red"
                                          onClick={() =>
                                            handleRemoveToken(token.address)
                                          }
                                        >
                                          Remove
                                        </Button>
                                      </AlertDialog.Action>
                                    </Flex>
                                  </AlertDialog.Content>
                                </AlertDialog.Root>
                              </Flex>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  )}
                </ScrollArea>
              </Card>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="portfolio">
            <Flex direction="column" gap="3" pt="3">
              {selectedAsset ? (
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="center">
                    <Flex direction="column">
                      <Text weight="medium">
                        {selectedAsset.symbol.toUpperCase()}
                      </Text>
                      <Text size="1" color="gray">
                        {selectedAsset.name}
                      </Text>
                    </Flex>
                    <Flex direction="column" align="end">
                      <Text weight="bold">
                        {formatCurrency(selectedAsset.price)}
                      </Text>
                      <Badge
                        color={selectedAsset.change24h >= 0 ? 'green' : 'red'}
                        variant="soft"
                        size="1"
                      >
                        {selectedAsset.change24h >= 0 ? '+' : ''}
                        {selectedAsset.change24h.toFixed(2)}%
                      </Badge>
                    </Flex>
                  </Flex>

                  <Separator />

                  <Flex direction="column" gap="2">
                    <Text size="2" weight="medium">
                      Your Holdings
                    </Text>
                    <Flex justify="between">
                      <Text size="2" color="gray">
                        Balance:
                      </Text>
                      <Text size="2" weight="medium">
                        {selectedAsset.balance?.toFixed(6) || '0.000000'}{' '}
                        {selectedAsset.symbol}
                      </Text>
                    </Flex>
                    <Flex justify="between">
                      <Text size="2" color="gray">
                        USD Value:
                      </Text>
                      <Text size="2" weight="medium">
                        {formatCurrency(selectedAsset.value || 0)}
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              ) : (
                <Flex direction="column" gap="2" align="center" py="6">
                  <Text size="2" color="gray">
                    Select a token to view details
                  </Text>
                  <Text size="1" color="gray">
                    Choose from your portfolio or price list
                  </Text>
                </Flex>
              )}
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="send">
            <Flex direction="column" gap="3" pt="3">
              {!wallet.canSign && (
                <Card variant="surface">
                  <Flex direction="column" gap="2" p="3">
                    <Text size="2" weight="medium" color="orange">
                      ⚠️ Transaction Signing Required
                    </Text>
                    <Text size="1" color="gray">
                      Connect with your 12-word seed phrase to enable
                      transaction signing and trading functionality.
                    </Text>
                  </Flex>
                </Card>
              )}

              {wallet.canSign && (
                <Card variant="surface">
                  <Flex direction="column" gap="2" p="3">
                    <Text size="2" weight="medium" color="green">
                      ✅ Transaction Signing Enabled
                    </Text>
                    <Text size="1" color="gray">
                      You can now send transactions using your imported seed
                      phrase wallet.
                    </Text>
                  </Flex>
                </Card>
              )}

              <Select.Root
                onValueChange={(value) => setSendType(value as 'eth' | 'token')}
                defaultValue="eth"
              >
                <Select.Trigger placeholder="Select transfer type" />
                <Select.Content>
                  <Select.Item value="eth">Send ETH</Select.Item>
                  <Select.Item value="token">Send Token</Select.Item>
                </Select.Content>
              </Select.Root>

              {sendType === 'eth' && (
                <>
                  <Text size="2" weight="medium">
                    Send ETH {wallet.canSign ? '' : '(Requires Seed Phrase)'}
                  </Text>

                  <TextField.Root
                    placeholder="Recipient address (0x...)"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    disabled={!wallet.canSign}
                  />

                  <TextField.Root
                    placeholder="Amount in ETH"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!wallet.canSign}
                  />

                  <Flex direction="column" gap="2">
                    <Flex justify="between">
                      <Text size="2" color="gray">
                        Available ETH
                      </Text>
                      <Text size="2" weight="medium">
                        {parseFloat(wallet.ethBalance).toFixed(6)} ETH
                      </Text>
                    </Flex>
                    <Flex justify="between">
                      <Text size="2" color="gray">
                        USD Value
                      </Text>
                      <Text size="2" weight="medium">
                        {formatCurrency(calculateETHValue())}
                      </Text>
                    </Flex>
                  </Flex>

                  <Button
                    size="3"
                    variant={wallet.canSign ? 'solid' : 'outline'}
                    onClick={handleETHTransfer}
                    disabled={
                      !wallet.canSign || !toAddress.trim() || !amount.trim()
                    }
                  >
                    {wallet.canSign
                      ? 'Send ETH'
                      : 'Connect Seed Phrase to Enable'}
                  </Button>

                  {!wallet.canSign && (
                    <Text size="1" color="gray" style={{ textAlign: 'center' }}>
                      💡 Go to Wallet Connect and enter your 12-word seed phrase
                      to enable trading
                    </Text>
                  )}
                </>
              )}

              {sendType === 'token' && (
                <>
                  <Text size="2" weight="medium">
                    Send Token {wallet.canSign ? '' : '(Requires Seed Phrase)'}
                  </Text>

                  <TextField.Root
                    placeholder="Recipient address (0x...)"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    disabled={!wallet.canSign}
                  />

                  <TextField.Root
                    placeholder="Token Address (0x...)"
                    value={tokenAddress}
                    onChange={(e) => handleTokenAddressChange(e.target.value)}
                    disabled={!wallet.canSign}
                  />

                  {isValidatingToken && (
                    <Flex align="center" gap="2">
                      <Text size="2" color="gray">
                        Validating token...
                      </Text>
                    </Flex>
                  )}

                  {tokenDetails && (
                    <Card variant="surface" style={{ padding: '12px' }}>
                      <Flex direction="column" gap="2">
                        <Text size="2" weight="medium">
                          Token Details
                        </Text>
                        <Text size="2">
                          <strong>Name:</strong> {tokenDetails.name}
                        </Text>
                        <Text size="2">
                          <strong>Symbol:</strong> {tokenDetails.symbol}
                        </Text>
                        <Text size="2">
                          <strong>Decimals:</strong> {tokenDetails.decimals}
                        </Text>
                        <Text size="2">
                          <strong>Total Supply:</strong>{' '}
                          {tokenDetails.totalSupply}
                        </Text>
                      </Flex>
                    </Card>
                  )}

                  <Flex direction="column" gap="2">
                    <Flex justify="between">
                      <Text size="2" color="gray">
                        Amount to Send
                      </Text>
                      <TextField.Root
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={!wallet.canSign}
                      />
                    </Flex>
                    <Flex justify="between">
                      <Text size="2" color="gray">
                        USD Value
                      </Text>
                      <Text size="2" weight="medium">
                        {formatCurrency(
                          parseFloat(amount) * (tokenDetails?.price || 0),
                        )}
                      </Text>
                    </Flex>
                  </Flex>

                  <Button
                    size="3"
                    variant={wallet.canSign ? 'solid' : 'outline'}
                    onClick={handleTokenTransfer}
                    disabled={
                      !wallet.canSign ||
                      !toAddress.trim() ||
                      !amount.trim() ||
                      !tokenDetails
                    }
                  >
                    {wallet.canSign
                      ? 'Send Token'
                      : 'Connect Seed Phrase to Enable'}
                  </Button>

                  {!wallet.canSign && (
                    <Text size="1" color="gray" style={{ textAlign: 'center' }}>
                      💡 Go to Wallet Connect and enter your 12-word seed phrase
                      to enable trading
                    </Text>
                  )}
                </>
              )}
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="swap">
            <Flex direction="column" gap="3" pt="3">
              {!wallet.canSign && (
                <Card variant="surface">
                  <Flex direction="column" gap="2" p="3">
                    <Text size="2" weight="medium" color="orange">
                      ⚠️ Transaction Signing Required
                    </Text>
                    <Text size="1" color="gray">
                      Connect with your 12-word seed phrase to enable swapping
                      functionality.
                    </Text>
                  </Flex>
                </Card>
              )}

              {wallet.canSign && (
                <Card variant="surface">
                  <Flex direction="column" gap="2" p="3">
                    <Text size="2" weight="medium" color="green">
                      ✅ Swap Available
                    </Text>
                    <Text size="1" color="gray">
                      Swap tokens directly using aggregated DEX liquidity.
                    </Text>
                  </Flex>
                </Card>
              )}

              <Text size="2" weight="medium">
                Swap Tokens {wallet.canSign ? '' : '(Requires Seed Phrase)'}
              </Text>

              <Flex direction="column" gap="2">
                <Text size="2" color="gray">
                  From Token
                </Text>
                <TextField.Root
                  placeholder="From token address (0x...)"
                  value={fromTokenAddress}
                  onChange={(e) => handleFromTokenChange(e.target.value)}
                  disabled={!wallet.canSign}
                />

                {fromTokenDetails && (
                  <Card variant="surface" style={{ padding: '8px' }}>
                    <Text size="2">
                      {fromTokenDetails.symbol} - {fromTokenDetails.name}
                    </Text>
                  </Card>
                )}
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" color="gray">
                  To Token
                </Text>
                <TextField.Root
                  placeholder="To token address (0x...)"
                  value={toTokenAddress}
                  onChange={(e) => handleToTokenChange(e.target.value)}
                  disabled={!wallet.canSign}
                />

                {toTokenDetails && (
                  <Card variant="surface" style={{ padding: '8px' }}>
                    <Text size="2">
                      {toTokenDetails.symbol} - {toTokenDetails.name}
                    </Text>
                  </Card>
                )}
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" color="gray">
                  Amount
                </Text>
                <TextField.Root
                  placeholder="Amount to swap"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  disabled={!wallet.canSign}
                />
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" color="gray">
                  Slippage Tolerance (%)
                </Text>
                <TextField.Root
                  placeholder="1.0"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  disabled={!wallet.canSign}
                />
              </Flex>

              {isValidatingToken && (
                <Flex align="center" gap="2">
                  <Text size="2" color="gray">
                    Validating tokens...
                  </Text>
                </Flex>
              )}

              <Button
                size="3"
                variant={wallet.canSign ? 'outline' : 'soft'}
                onClick={handleGetSwapQuote}
                disabled={
                  !wallet.canSign ||
                  !fromTokenDetails ||
                  !toTokenDetails ||
                  !swapAmount.trim() ||
                  isGettingQuote
                }
              >
                {isGettingQuote ? 'Getting Quote...' : 'Get Quote'}
              </Button>

              {swapQuote && (
                <Card variant="surface" style={{ padding: '12px' }}>
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="medium">
                      Swap Quote
                    </Text>
                    <Text size="2">
                      <strong>You&apos;ll receive:</strong>{' '}
                      {ethers.formatUnits(
                        swapQuote.toAmount,
                        toTokenDetails?.decimals || 18,
                      )}{' '}
                      {toTokenDetails?.symbol}
                    </Text>
                    <Text size="2">
                      <strong>Estimated Gas:</strong> {swapQuote.estimatedGas}
                    </Text>
                  </Flex>
                </Card>
              )}

              <Button
                size="3"
                variant={wallet.canSign ? 'solid' : 'outline'}
                onClick={handleExecuteSwap}
                disabled={
                  !wallet.canSign ||
                  !swapQuote ||
                  !fromTokenDetails ||
                  !toTokenDetails
                }
              >
                {wallet.canSign
                  ? 'Execute Swap'
                  : 'Connect Seed Phrase to Enable'}
              </Button>

              {!wallet.canSign && (
                <Text size="1" color="gray" style={{ textAlign: 'center' }}>
                  💡 Go to Wallet Connect and enter your 12-word seed phrase to
                  enable swapping
                </Text>
              )}
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </Card>
  );
}
