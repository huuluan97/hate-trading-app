interface PersistenceConfig {
  encrypt?: boolean;
  expiresIn?: number; // milliseconds
}

interface StoredData<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

class PersistenceManager {
  private readonly STORAGE_PREFIX = 'trading_app_';

  private getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }

  private encrypt(data: string): string {
    // Simple base64 encoding with prefix for identification
    return `${this.STORAGE_PREFIX}enc:${btoa(data)}`;
  }

  private decrypt(data: string): string {
    try {
      const prefix = `${this.STORAGE_PREFIX}enc:`;
      if (!data.startsWith(prefix)) {
        throw new Error('Invalid encrypted data format');
      }
      return atob(data.substring(prefix.length));
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }

  save<T>(key: string, data: T, config: PersistenceConfig = {}): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      const timestamp = Date.now();
      const expiresAt = config.expiresIn
        ? timestamp + config.expiresIn
        : undefined;

      const storedData: StoredData<T> = {
        data,
        timestamp,
        expiresAt,
      };

      let serializedData = JSON.stringify(storedData);

      if (config.encrypt) {
        serializedData = this.encrypt(serializedData);
      }

      localStorage.setItem(storageKey, serializedData);
      return true;
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      return false;
    }
  }

  load<T>(key: string, config: PersistenceConfig = {}): T | null {
    try {
      const storageKey = this.getStorageKey(key);
      let storedValue = localStorage.getItem(storageKey);

      if (!storedValue) {
        return null;
      }

      if (config.encrypt) {
        storedValue = this.decrypt(storedValue);
      }

      const storedData: StoredData<T> = JSON.parse(storedValue);

      // Check expiration
      if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
        this.remove(key);
        return null;
      }

      return storedData.data;
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
      return null;
    }
  }

  remove(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove data for key ${key}:`, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter((key) => key.startsWith(this.STORAGE_PREFIX));

      appKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.error('Failed to clear app data:', error);
      return false;
    }
  }

  exists(key: string): boolean {
    const storageKey = this.getStorageKey(key);
    return localStorage.getItem(storageKey) !== null;
  }

  // App-specific persistence methods
  saveWalletState(walletState: any): boolean {
    return this.save('wallet_state', walletState, { encrypt: true });
  }

  loadWalletState(): any | null {
    return this.load('wallet_state', { encrypt: true });
  }

  saveNetworkSelection(network: string): boolean {
    return this.save('current_network', network);
  }

  loadNetworkSelection(): string | null {
    return this.load('current_network');
  }

  saveFormInputs(componentName: string, inputs: Record<string, any>): boolean {
    return this.save(`form_inputs_${componentName}`, inputs);
  }

  loadFormInputs(componentName: string): Record<string, any> | null {
    return this.load(`form_inputs_${componentName}`);
  }

  saveUserPreferences(preferences: Record<string, any>): boolean {
    return this.save('user_preferences', preferences);
  }

  loadUserPreferences(): Record<string, any> | null {
    return this.load('user_preferences');
  }

  // Encrypted credential storage
  saveCredentials(credentials: Record<string, any>): boolean {
    return this.save('encrypted_credentials', credentials, { encrypt: true });
  }

  loadCredentials(): Record<string, any> | null {
    return this.load('encrypted_credentials', { encrypt: true });
  }

  removeCredentials(): boolean {
    return this.remove('encrypted_credentials');
  }
}

export const persistence = new PersistenceManager();
export default persistence;
