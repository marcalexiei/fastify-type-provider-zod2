import type { JSONSchemaMeta } from 'zod/v4/core';

/**
 * Use this interface to type-check your data or define your custom schema
 */
export interface ZodOpenApiSchemaMetadata extends JSONSchemaMeta {
  /**
   * Use this to add examples to the generated openAPI spec
   */
  example?: unknown;
}

declare module 'zod/v4/core' {
  interface GlobalMeta extends ZodOpenApiSchemaMetadata {}
}
