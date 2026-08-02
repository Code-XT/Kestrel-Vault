import { create } from 'zustand';
import type { VaultItem } from '@/types';
import * as storage from '@/services/storage';
import { hasVaultKey } from '@/services/keystore';
import { authenticateWithBiometrics, getBiometricCapabilities } from '@/services/biometrics';

interface VaultIndexEntry {
  id: string;
  category: VaultItem['category'];
  title: string;
  updatedAt: number;
}

interface AppState {
  isUnlocked: boolean;
  isInitializing: boolean;
  biometricsAvailable: boolean;
  index: VaultIndexEntry[];

  bootstrap: () => Promise<void>;
  unlock: () => Promise<boolean>;
  lock: () => void;

  refreshIndex: () => Promise<void>;
  saveItem: (item: VaultItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItem: (id: string) => Promise<VaultItem | null>;
  wipeVault: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isUnlocked: false,
  isInitializing: true,
  biometricsAvailable: false,
  index: [],

  bootstrap: async () => {
    await storage.initStorage();
    const { available, enrolled } = await getBiometricCapabilities();
    const keyExists = await hasVaultKey();
    set({
      isInitializing: false,
      biometricsAvailable: available && enrolled,
      // First-run (no key yet) skips the lock screen; it will be created on first save.
      isUnlocked: !keyExists,
    });
  },

  unlock: async () => {
    const success = await authenticateWithBiometrics('Unlock your Kestrel Vault');
    if (success) {
      set({ isUnlocked: true });
      await get().refreshIndex();
    }
    return success;
  },

  lock: () => set({ isUnlocked: false }),

  refreshIndex: async () => {
    const rows = await storage.listVaultIndex();
    set({ index: rows });
  },

  saveItem: async (item: VaultItem) => {
    await storage.saveVaultItem(item);
    await get().refreshIndex();
  },

  deleteItem: async (id: string) => {
    await storage.deleteVaultItem(id);
    await get().refreshIndex();
  },

  getItem: async (id: string) => storage.getVaultItem(id),

  wipeVault: async () => {
    await storage.clearAllVaultItems();
    await get().refreshIndex();
  },
}));
