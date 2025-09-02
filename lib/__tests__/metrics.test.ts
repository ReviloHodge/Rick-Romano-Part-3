import test from 'node:test';
import assert from 'node:assert/strict';
import { PostHog } from 'posthog-node';

test('flush drains queued events', async () => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test';
  const { track, flush } = await import('../metrics');

  const events: any[] = [];
  PostHog.prototype.capture = function (event: any) {
    events.push(event);
  };
  PostHog.prototype.flush = async function () {
    events.length = 0;
  };

  track('example', undefined);
  assert.equal(events.length, 1);

  await flush();
  assert.equal(events.length, 0);
});
