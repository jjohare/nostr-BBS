import { vi } from 'vitest';

export const getStores = vi.fn();
export const navigating = { subscribe: vi.fn() };
export const page = { subscribe: vi.fn() };
export const updated = { subscribe: vi.fn() };
