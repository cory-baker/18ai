import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, enginePlaceholder } from '../src/index.js';

describe('@18ai/engine toolchain smoke test', () => {
  it('exports a placeholder that returns the engine version and a message', () => {
    const result = enginePlaceholder();
    expect(result.version).toBe(ENGINE_VERSION);
    expect(result.message).toContain('@18ai/engine');
  });
});
