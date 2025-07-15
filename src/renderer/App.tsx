import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Theme,
  Container,
  Grid,
  Flex,
  Text,
  Heading,
  Box,
} from '@radix-ui/themes';
import './App.css';

import WalletConnect from './components/WalletConnect';
import Portfolio from './components/Portfolio';
import PriceDisplay from './components/PriceDisplay';
import TradingInterface from './components/TradingInterface';
import TransactionHistory from './components/TransactionHistory';
import ErrorDisplay from './components/ErrorDisplay';
import useAppStore from './store';

function TradingApp() {
  const { wallet, restoreState } = useAppStore();

  // Initialize app by restoring persisted state
  useEffect(() => {
    restoreState();
  }, [restoreState]);

  return (
    <Box>
      <Container size="4" p="4">
        <Flex direction="column" gap="6">
          <Flex justify="between" align="center">
            <Heading size="8" style={{ color: '#1a1a1a' }}>
              Trading App
            </Heading>
            <Text size="3" color="gray">
              {wallet.connected ? (
                <Text weight="medium" color="green">
                  Wallet Connected
                </Text>
              ) : (
                <Text color="gray">No Wallet Connected</Text>
              )}
            </Text>
          </Flex>

          <ErrorDisplay />

          <Grid columns={{ initial: '1', md: '3' }} gap="4">
            <Flex direction="column" gap="4">
              <WalletConnect />
              <TradingInterface />
            </Flex>

            <PriceDisplay />

            <Portfolio />
          </Grid>

          <TransactionHistory />

          <Flex justify="center" py="4">
            <Text size="1" color="gray">
              Demo Trading App - Not for real trading
            </Text>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

export default function App() {
  return (
    <Theme radius="medium" scaling="100%" accentColor="blue">
      <Router>
        <Routes>
          <Route path="/" element={<TradingApp />} />
        </Routes>
      </Router>
    </Theme>
  );
}
