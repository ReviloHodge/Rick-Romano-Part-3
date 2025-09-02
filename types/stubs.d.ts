declare module 'zod' {
  export const z: any;
  export namespace z {
    export type infer<T> = any;
  }
}

declare module '@sentry/nextjs' {
  export function init(options?: any): void;
}

declare module '@playwright/test' {
  export type Page = any;
  export const test: (name: string, fn: (context: { page: Page }) => any) => void;
  export const expect: (...args: any[]) => any;
  export const defineConfig: (config: any) => any;
}

declare module 'vitest' {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void) => void;
  export const expect: (value: any) => any;
}
