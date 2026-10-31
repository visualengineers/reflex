import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: fileURLToPath(new URL('../../test/artifacts/coverage/gestenrecorder/', import.meta.url))
    }
  }
});
