import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcXpGain, calcLevel } from '../src/lib/xp.js';

describe('calcXpGain', () => {
  it('returns 10 for new quiz correct', () => {
    assert.strictEqual(calcXpGain(true, false), 10);
  });

  it('returns 5 for review quiz correct', () => {
    assert.strictEqual(calcXpGain(true, true), 5);
  });

  it('returns 0 for incorrect', () => {
    assert.strictEqual(calcXpGain(false, false), 0);
    assert.strictEqual(calcXpGain(false, true), 0);
  });
});

describe('calcLevel', () => {
  it('returns level 1 for 0 xp', () => {
    assert.strictEqual(calcLevel(0), 1);
  });

  it('returns level 1 for 99 xp', () => {
    assert.strictEqual(calcLevel(99), 1);
  });

  it('returns level 2 for 100 xp', () => {
    assert.strictEqual(calcLevel(100), 2);
  });

  it('returns level 11 for 1000 xp', () => {
    assert.strictEqual(calcLevel(1000), 11);
  });
});
