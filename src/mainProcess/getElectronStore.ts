import { app } from 'electron';
import ElectronStore from 'electron-store';

import type { PersistableValues } from '../common/types/PersistableValues';
import { migrations } from './migrations';

let electronStore: ElectronStore<PersistableValues>;

export const getElectronStore = (): ElectronStore<PersistableValues> => {
  if (!electronStore) {
    electronStore = new ElectronStore<PersistableValues>({
      migrations: Object.fromEntries(
        Object.entries(migrations).map(([semver, transform]) => [
          semver,
          (store: { store: PersistableValues }) => {
            store.store = transform(store.store as any) as any;
          },
        ])
      ),
      projectVersion: app.getVersion(),
    } as ElectronStore.Options<PersistableValues>);
  }

  return electronStore;
};
