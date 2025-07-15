import React from 'react';
import { Callout, Button } from '@radix-ui/themes';
import useAppStore from '../store';

export default function ErrorDisplay() {
  const { error, setError } = useAppStore();

  if (!error) return null;

  return (
    <Callout.Root color="red" style={{ marginBottom: '16px' }}>
      <Callout.Text>{error}</Callout.Text>
      <Button
        variant="ghost"
        size="1"
        onClick={() => setError(null)}
        style={{ marginLeft: '8px' }}
      >
        ×
      </Button>
    </Callout.Root>
  );
}
