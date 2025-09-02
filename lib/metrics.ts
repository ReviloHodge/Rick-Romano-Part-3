import { PostHog } from 'posthog-node';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.POSTHOG_HOST;

const client = key ? new PostHog(key, { host }) : null;

export const track = (
  event: string,
  distinctId: string | undefined,
  properties?: Record<string, any>
) => {
  if (!client) return;
  client.capture({ event, distinctId: distinctId || 'anon', properties });
};

export const flush = async () => {
  if (!client) return;
  await client.flush();
};

if (client) {
  const handleExit = async () => {
    try {
      await flush();
    } catch {
      // ignore flush errors during shutdown
    }
  };
  ['beforeExit', 'SIGINT', 'SIGTERM'].forEach((evt) =>
    process.once(evt as any, handleExit)
  );
}
