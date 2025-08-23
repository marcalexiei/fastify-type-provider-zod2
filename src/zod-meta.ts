import type { JSONSchemaMeta } from 'zod/v4/core';

export interface ZodOpenApiMetadata extends JSONSchemaMeta {
  /**
   * Use this to add examples to the generated openAPI spec
   */
  example?: unknown;
}

declare module 'zod/v4/core' {
  interface GlobalMeta extends ZodOpenApiMetadata {}
}
