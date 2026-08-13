// Jest setup: provide lightweight shims so non-RN module imports (and some RN-backed
// modules used only at runtime) don't break unit tests of the pure engine and services.
// The pure domain/workout engine never imports React Native, so these shims are mostly
// a safety net for storage/service tests.

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  openDatabase: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    getItem: jest.fn((k) => Promise.resolve(store.has(k) ? store.get(k) : null)),
    setItem: jest.fn((k, v) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    removeItem: jest.fn((k) => {
      store.delete(k);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Array.from(store.keys()))),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
    __store: store,
  };
});
