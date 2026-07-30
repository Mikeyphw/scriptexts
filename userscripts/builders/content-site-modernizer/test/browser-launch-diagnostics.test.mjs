import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const runner = readFileSync(new URL('../../../../tools/smoke/run-content-site-smoke.py', import.meta.url), 'utf8');

test('smoke runner preserves executable paths and reports actionable launch errors', () => {
  assert.match(runner, /def resolve_browser_executable/);
  assert.match(runner, /def describe_browser_executable/);
  assert.match(runner, /PLAYWRIGHT_EXECUTABLE_PATH/);
  assert.match(runner, /Attempted executable:/);
  assert.match(runner, /Launch error: \{type\(exc\)\.__name__\}: \{exc\}/);
  assert.match(runner, /command -v chromium/);
});

