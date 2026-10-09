import { registerSW } from 'virtual:pwa-register';
import { describe, expect, it, vi } from 'vitest';

import { registerServiceWorker } from './registerServiceWorker';

vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn(),
}));

describe('registerServiceWorker', () => {
  it('registers the service worker without a prompt callback', () => {
    registerServiceWorker();

    expect(registerSW).toHaveBeenCalledOnce();
    expect(registerSW).toHaveBeenCalledWith();
  });
});
