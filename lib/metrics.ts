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
