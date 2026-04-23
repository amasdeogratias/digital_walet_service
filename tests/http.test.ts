import test from 'node:test';
import assert from 'node:assert/strict';
import { getIdempotencyKey } from '../src/utils/http';

test('returns trimmed idempotency key header when present', () => {
  const request = {
    header: (name: string) => (name === 'Idempotency-Key' ? ' abc-123 ' : undefined)
  };

  assert.equal(getIdempotencyKey(request as never), 'abc-123');
});
