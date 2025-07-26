import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { JSONSchema } from 'zod/v4/core';

// todo remove ts-expect-error

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

  /* v8 ignore next */
  throw new Error('Unsupported OpenAPI document object');
};

export const convertSchemaToOpenAPISchemaVersion = (
  jsonSchema: JSONSchema.BaseSchema,
  openAPISchemaVersion: OpenAPISchemaVersion,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: life is bitter :(
): JSONSchema.BaseSchema => {
  if (openAPISchemaVersion === '3.1') {
    return jsonSchema;
  }

  const clone = { ...jsonSchema };

  // if (clone.type === 'null') {
  //   clone.nullable = true;
  //   delete clone.type;
  //   clone.enum = [null];
  // }

  if (clone.oneOf?.some((s) => s.type === 'null')) {
    const notNullableItems = clone.oneOf.filter((s) => s.type !== 'null');
    clone.nullable = true;
    clone.oneOf = notNullableItems;
  }

  if (clone.anyOf?.some((s) => s.type === 'null')) {
    const notNullableItems = clone.anyOf.filter((s) => s.type !== 'null');
    /**
     * Convert any `anyOf` schemas with two elements, one of which is `"type": "null"`,
     * into a single schema with nullable: true."
     * @see https://github.com/turkerdev/fastify-type-provider-zod/issues/192
     * @see https://stackoverflow.com/a/48114924
     */
    if (clone.anyOf.length === 2) {
      Object.assign(
        clone,
        // If length is 2 it means there is only one element besides `null`
        notNullableItems[0],
        { nullable: true },
      );
      delete clone.anyOf;
    } else {
      clone.nullable = true;
      // `nullable` replaces the `type: null` so replace anyOf with all other items
      clone.anyOf = notNullableItems;
    }
  }

  if (Array.isArray(clone.prefixItems)) {
    const tuple = clone.prefixItems;

    clone.minItems ??= tuple.length;
    clone.maxItems ??= tuple.length;

    clone.items = {
      // @ts-expect-error
      oneOf: tuple.map(convertSchemaToOpenAPISchemaVersion),
    };

    delete clone.prefixItems;
  }

  if ('const' in clone && clone.const !== undefined) {
    clone.enum = [clone.const];
    delete clone.const;
  }

  if (typeof clone.exclusiveMinimum === 'number') {
    clone.minimum = clone.exclusiveMinimum;
    delete clone.exclusiveMinimum;
  }
  if (typeof clone.exclusiveMaximum === 'number') {
    clone.maximum = clone.exclusiveMaximum;
    delete clone.exclusiveMaximum;
  }

  for (const key of [
    '$schema',
    '$id',
    'unevaluatedProperties',
    'dependentSchemas',
    'patternProperties',
    'propertyNames',
    'contentEncoding',
    'contentMediaType',
  ]) {
    delete clone[key];
  }

  const recursive = (v: JSONSchema.BaseSchema): unknown => {
    if (Array.isArray(v)) {
      return v.map((it) =>
        convertSchemaToOpenAPISchemaVersion(it, openAPISchemaVersion),
      );
    }
    return convertSchemaToOpenAPISchemaVersion(v, openAPISchemaVersion);
  };

  if (clone.properties) {
    for (const [k, v] of Object.entries(clone.properties)) {
      // @ts-expect-error
      clone.properties[k] = convertSchemaToOpenAPISchemaVersion(v);
    }
  }

  if (clone.items && !Array.isArray(clone.items)) {
    // @ts-expect-error
    clone.items = recursive(clone.items);
  }

  for (const key of [
    'allOf',
    'anyOf',
    'oneOf',
    'not',
    'then',
    'else',
    'if',
    'contains',
  ]) {
    if (clone[key]) {
      // @ts-expect-error
      clone[key] = recursive(clone[key]);
    }
  }

  return clone;
};
