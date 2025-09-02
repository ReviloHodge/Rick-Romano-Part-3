export class PostHog {
  constructor(_apiKey: string, _opts?: any) {}
  capture(_event: { event: string; distinctId?: string; properties?: any }) {}
  flush() {}
}
