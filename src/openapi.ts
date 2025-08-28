import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { JSONSchema } from 'zod/v4/core';

export type OpenAPISchemaVersion = '3.0' | '3.1';

export const getOpenAPISchemaVersion = (documentObject: {
  openapiObject: Partial<OpenAPIV3.Document | OpenAPIV3_1.Document>;
}): OpenAPISchemaVersion => {
  const openapiVersion = documentObject.openapiObject.openapi;

  if (openapiVersion?.startsWith('3.1')) {
    return '3.1';
  }

  if (openapiVersion?.startsWith('3.0')) {
    return '3.0';
  }

  /* v8 ignore next 2 */
  throw new Error('Unsupported OpenAPI document object');
};

export const removeJSONSchemaPropertiesNotUsedByOpenAPI = (
  jsonSchema: JSONSchema.BaseSchema,
  options: { openAPISchemaVersion: OpenAPISchemaVersion },
): JSONSchema.BaseSchema => {
  // keeping this around just in case of additional customization based on open api version
  const { openAPISchemaVersion: _ } = options;

  const clone = { ...jsonSchema };

  delete clone.$schema;
  delete clone.$id;
  delete clone.id;

  return clone;
};
