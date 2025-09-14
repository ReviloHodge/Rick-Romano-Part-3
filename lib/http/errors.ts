export class UpstreamAuthError extends Error {
  constructor(message: string = 'Upstream auth error', public status: number = 401) {
    super(message);
    this.name = 'UpstreamAuthError';
  }
}

export class UpstreamRateLimitError extends Error {
  constructor(message: string = 'Upstream rate limited', public status: number = 429) {
    super(message);
    this.name = 'UpstreamRateLimitError';
  }
}

export class UpstreamServerError extends Error {
  constructor(message: string = 'Upstream server error', public status: number = 502) {
    super(message);
    this.name = 'UpstreamServerError';
  }
}

export class InvalidResponseError extends Error {
  constructor(message: string = 'Invalid response from upstream', public status: number = 500) {
    super(message);
    this.name = 'InvalidResponseError';
  }
}

