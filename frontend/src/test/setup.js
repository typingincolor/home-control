import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Setup localStorage mock if not available (jsdom should provide it)
if (typeof global.localStorage === 'undefined') {
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: key => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      removeItem: key => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
  })();
  global.localStorage = localStorageMock;
}

// Cleanup after each test
afterEach(() => {
  cleanup();
  if (localStorage && typeof localStorage.clear === 'function') {
    localStorage.clear();
  }
});
