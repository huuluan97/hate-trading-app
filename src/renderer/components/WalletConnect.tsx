import React, { useState, useEffect } from 'react';
import {
  Card,
  Flex,
  Text,
  Button,
  TextField,
  Badge,
  Switch,
  Callout,
  Tabs,
  Select,
  IconButton,
} from '@radix-ui/themes';
import {
  LockClosedIcon,
  ExclamationTriangleIcon,
  CopyIcon,
  CheckIcon,
} from '@radix-ui/react-icons';
import useAppStore from '../store';
import { priceService } from '../services/priceService';
import { getNetworkIcon } from '../utils/networkIcons';
import { persistence } from '../utils/persistence';

export default function WalletConnect() {
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedTab, setSelectedTab] = useState('mnemonic');
  const [ethPrice, setEthPrice] = useState<number>(0);
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

  const {
    wallet,
    isLoading,
    error,
    connectWithMnemonic,
    connectWithPrivateKey,
    disconnectWallet,
    setError,
    validateMnemonic,
    validatePrivateKey,
    currentNetwork,
    availableNetworks,
    setNetwork,
  } = useAppStore();

  // Fetch ETH price on component mount and when wallet balance changes
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const price = await priceService.getETHPrice();
        setEthPrice(price);
      } catch (err) {
        console.error('Failed to fetch ETH price:', err);
      }
    };

    if (wallet.connected) {
      fetchEthPrice();
      // Refresh price every 30 seconds
      const interval = setInterval(fetchEthPrice, 30000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [wallet.connected, wallet.ethBalance]);

  // Restore form inputs on component mount
  useEffect(() => {
    const savedInputs = persistence.loadFormInputs('WalletConnect');
    if (savedInputs) {
      if (savedInputs.selectedTab) setSelectedTab(savedInputs.selectedTab);
      if (savedInputs.agreedToTerms)
        setAgreedToTerms(savedInputs.agreedToTerms);
      if (savedInputs.showMnemonic !== undefined)
        setShowMnemonic(savedInputs.showMnemonic);
      if (savedInputs.showPrivateKey !== undefined)
        setShowPrivateKey(savedInputs.showPrivateKey);
    }

    // Restore encrypted credentials
    const savedCredentials = persistence.loadCredentials();
    if (savedCredentials) {
      if (savedCredentials.privateKey)
        setPrivateKey(savedCredentials.privateKey);
      if (savedCredentials.mnemonic) setMnemonic(savedCredentials.mnemonic);
    }
  }, []);

  // Save form inputs when they change
  useEffect(() => {
    const inputsToSave = {
      selectedTab,
      agreedToTerms,
      showMnemonic,
      showPrivateKey,
    };
    persistence.saveFormInputs('WalletConnect', inputsToSave);
  }, [selectedTab, agreedToTerms, showMnemonic, showPrivateKey]);

  // Save encrypted credentials when they change
  useEffect(() => {
    if (mnemonic || privateKey) {
      const credentialsToSave: Record<string, string> = {};
      if (mnemonic) credentialsToSave.mnemonic = mnemonic;
      if (privateKey) credentialsToSave.privateKey = privateKey;
      persistence.saveCredentials(credentialsToSave);
    }
  }, [mnemonic, privateKey]);

  const handleConnectWithMnemonic = async () => {
    if (!mnemonic.trim()) {
      setError('Please enter your 12-word seed phrase');
      return;
    }

    if (!validateMnemonic(mnemonic.trim())) {
      setError('Invalid seed phrase. Please check your 12-word mnemonic.');
      return;
    }

    if (!agreedToTerms) {
      setError('Please acknowledge the security risks before proceeding');
      return;
    }

    try {
      await connectWithMnemonic(mnemonic.trim());
      // Don't clear mnemonic anymore - it will be saved encrypted for next time
      setAgreedToTerms(false);
      setShowMnemonic(false);
    } catch (err) {
      console.error('Mnemonic connection failed:', err);
    }
  };

  const handleConnectWithPrivateKey = async () => {
    if (!privateKey.trim()) {
      setError('Please enter your private key');
      return;
    }

    if (!validatePrivateKey(privateKey.trim())) {
      setError('Invalid private key. Please check your private key format.');
      return;
    }

    if (!agreedToTerms) {
      setError('Please acknowledge the security risks before proceeding');
      return;
    }

    try {
      await connectWithPrivateKey(privateKey.trim());
      // Don't clear private key anymore - it will be saved encrypted for next time
      setAgreedToTerms(false);
      setShowPrivateKey(false);
    } catch (err) {
      console.error('Private key connection failed:', err);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    // Clear stored credentials when user explicitly disconnects
    persistence.removeCredentials();
    setMnemonic('');
    setPrivateKey('');
    setAgreedToTerms(false);
  };

  const validateMnemonicInput = (input: string): boolean => {
    const words = input.trim().split(/\s+/);
    return words.length === 12 && validateMnemonic(input);
  };

  const getMnemonicValidationStatus = () => {
    if (!mnemonic.trim()) return null;

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      return { valid: false, message: `${words.length}/12 words entered` };
    }

    const isValid = validateMnemonic(mnemonic.trim());
    return {
      valid: isValid,
      message: isValid ? 'Valid seed phrase' : 'Invalid seed phrase',
    };
  };

  const getPrivateKeyValidationStatus = () => {
    if (!privateKey.trim()) return null;

    const isValid = validatePrivateKey(privateKey.trim());
    return {
      valid: isValid,
      message: isValid ? 'Valid private key' : 'Invalid private key format',
    };
  };

  if (wallet.connected) {
    return (
      <Card>
        <Flex direction="column" gap="4" p="4">
          <Flex justify="between" align="center">
            <Text size="4" weight="bold">
              Wallet Connected
            </Text>
            <Badge color="green" size="2">
              {wallet.type === 'mnemonic'
                ? 'Seed Phrase Wallet'
                : 'Private Key Wallet'}
            </Badge>
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" color="gray">
              Address
            </Text>
            <Flex align="center" gap="2">
              <Text
                size="2"
                style={{
                  fontFamily: 'monospace',
                  maxWidth: '300px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={wallet.address}
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
              Balance
            </Text>
            <Flex direction="column" gap="1">
              <Text size="2">{wallet.ethBalance} ETH</Text>
              {ethPrice > 0 && (
                <Text size="1" color="gray">
                  ≈ ${(parseFloat(wallet.ethBalance) * ethPrice).toFixed(2)} USD
                </Text>
              )}
            </Flex>
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" color="gray">
              Network
            </Text>
            <Select.Root value={currentNetwork} onValueChange={setNetwork}>
              <Select.Trigger>
                <Flex align="center" gap="2">
                  <Text size="2">{getNetworkIcon(currentNetwork)}</Text>
                  <Text>
                    {availableNetworks[currentNetwork]?.name || currentNetwork}
                  </Text>
                </Flex>
              </Select.Trigger>
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
          </Flex>

          <Button color="red" onClick={handleDisconnect}>
            Disconnect Wallet
          </Button>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="4" p="4">
        <Flex direction="column" gap="2">
          <Text size="5" weight="bold">
            Connect Wallet
          </Text>
          <Text size="2" color="gray">
            Choose your preferred wallet connection method
          </Text>
        </Flex>

        <Tabs.Root value={selectedTab} onValueChange={setSelectedTab}>
          <Tabs.List>
            <Tabs.Trigger value="mnemonic">Seed Phrase</Tabs.Trigger>
            <Tabs.Trigger value="privateKey">Private Key</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="mnemonic">
            <Flex direction="column" gap="4" mt="4">
              <Callout.Root color="orange">
                <Callout.Icon>
                  <ExclamationTriangleIcon />
                </Callout.Icon>
                <Callout.Text>
                  <Text size="2" weight="bold">
                    Security Warning
                  </Text>
                  <br />
                  Your seed phrase is stored temporarily in memory and will be
                  cleared when you disconnect. Never share your seed phrase with
                  anyone.
                </Callout.Text>
              </Callout.Root>

              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" weight="medium">
                    12-Word Seed Phrase
                  </Text>
                  <Flex align="center" gap="2">
                    <Text size="1" color="gray">
                      Show
                    </Text>
                    <Switch
                      checked={showMnemonic}
                      onCheckedChange={setShowMnemonic}
                    />
                  </Flex>
                </Flex>

                <TextField.Root
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="Enter your 12-word seed phrase..."
                  type={showMnemonic ? 'text' : 'password'}
                  size="2"
                />

                {mnemonic && (
                  <Text size="1" color="green" style={{ fontSize: '10px' }}>
                    🔐 Encrypted and saved locally for convenience
                  </Text>
                )}

                {getMnemonicValidationStatus() && (
                  <Text
                    size="1"
                    color={
                      getMnemonicValidationStatus()?.valid ? 'green' : 'red'
                    }
                  >
                    {getMnemonicValidationStatus()?.message}
                  </Text>
                )}
              </Flex>

              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <Switch
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                  />
                  <Text size="2">
                    I understand the security risks and have backed up my seed
                    phrase
                  </Text>
                </Flex>
              </Flex>

              <Button
                onClick={handleConnectWithMnemonic}
                disabled={
                  isLoading ||
                  !validateMnemonicInput(mnemonic) ||
                  !agreedToTerms
                }
                loading={isLoading}
              >
                <LockClosedIcon />
                Connect with Seed Phrase
              </Button>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="privateKey">
            <Flex direction="column" gap="4" mt="4">
              <Callout.Root color="orange">
                <Callout.Icon>
                  <ExclamationTriangleIcon />
                </Callout.Icon>
                <Callout.Text>
                  <Text size="2" weight="bold">
                    Security Warning
                  </Text>
                  <br />
                  Your private key is encrypted and saved locally for
                  convenience. It will be cleared when you disconnect. Never
                  share your private key with anyone.
                </Callout.Text>
              </Callout.Root>

              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" weight="medium">
                    Private Key
                  </Text>
                  <Flex align="center" gap="2">
                    <Text size="1" color="gray">
                      Show
                    </Text>
                    <Switch
                      checked={showPrivateKey}
                      onCheckedChange={setShowPrivateKey}
                    />
                  </Flex>
                </Flex>

                <TextField.Root
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter your private key (0x... or 64 hex characters)"
                  type={showPrivateKey ? 'text' : 'password'}
                  size="2"
                />

                {privateKey && (
                  <Text size="1" color="green" style={{ fontSize: '10px' }}>
                    🔐 Encrypted and saved locally for convenience
                  </Text>
                )}

                {getPrivateKeyValidationStatus() && (
                  <Text
                    size="1"
                    color={
                      getPrivateKeyValidationStatus()?.valid ? 'green' : 'red'
                    }
                  >
                    {getPrivateKeyValidationStatus()?.message}
                  </Text>
                )}
              </Flex>

              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <Switch
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                  />
                  <Text size="2">
                    I understand the security risks and have backed up my
                    private key
                  </Text>
                </Flex>
              </Flex>

              <Button
                onClick={handleConnectWithPrivateKey}
                disabled={
                  isLoading || !validatePrivateKey(privateKey) || !agreedToTerms
                }
                loading={isLoading}
              >
                <LockClosedIcon />
                Connect with Private Key
              </Button>
            </Flex>
          </Tabs.Content>
        </Tabs.Root>

        {error && (
          <Callout.Root color="red">
            <Callout.Icon>
              <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
      </Flex>
    </Card>
  );
}
