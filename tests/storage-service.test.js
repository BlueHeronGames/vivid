import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../engine/core/storage-service.js';

describe('StorageService', () => {
  const storageKey = 'test_save';
  let storage;
  let backingStore;

  beforeEach(() => {
    backingStore = {};

    globalThis.localStorage = {
      getItem: vi.fn((key) => (key in backingStore ? backingStore[key] : null)),
      setItem: vi.fn((key, value) => {
        backingStore[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete backingStore[key];
      }),
      clear: vi.fn(() => {
        backingStore = {};
      })
    };

    storage = new StorageService(storageKey);
  });

  it('returns null when no data is stored', () => {
    expect(storage.load()).toBeNull();
  });

  it('saves and loads data', () => {
    const payload = { foo: 'bar', nested: { value: 42 } };
    storage.save(payload);

    const loaded = storage.load();
    expect(loaded).toEqual(payload);
  });

  it('clears saved data', () => {
    storage.save({ foo: 'bar' });
    storage.clear();
    expect(storage.load()).toBeNull();
  });
});
