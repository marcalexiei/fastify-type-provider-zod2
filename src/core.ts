import type {
  SwaggerTransform,
  SwaggerTransformObject,
} from '@fastify/swagger';
import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifySchema,
  FastifySchemaCompiler,
  FastifyTypeProvider,
  RawServerBase,
  RawServerDefault,
} from 'fastify';
// When https://github.com/fastify/fastify/pull/6207 is released when can import from fastify
import type { FastifySerializerCompiler } from 'fastify/types/schema.js';
import type { $ZodRegistry, input, output } from 'zod/v4/core';
import { $ZodType, globalRegistry, safeParse } from 'zod/v4/core';

import {
  createValidationError,
  InvalidSchemaError,
  ResponseSerializationError,
} from './errors.ts';
import { getOpenAPISchemaVersion } from './openapi.ts';
import {
  removeUnusedRefs,
  zodRegistryToJson,
  zodSchemaToJson,
} from './zod-to-json.ts';

const defaultSkipList = [
  '/documentation/',
  '/documentation/initOAuth',
  '/documentation/json',
  '/documentation/uiConfig',
  '/documentation/yaml',
  '/documentation/*',
  '/documentation/static/*',
];

export interface ZodTypeProvider extends FastifyTypeProvider {
  validator: this['schema'] extends $ZodType ? output<this['schema']> : unknown;
  serializer: this['schema'] extends $ZodType ? input<this['schema']> : unknown;
}

interface Schema extends FastifySchema {
  hide?: boolean;
}

interface CreateJsonSchemaTransformOptions {
  skipList?: ReadonlyArray<string>;
  schemaRegistry?: $ZodRegistry<{ id?: string | undefined }>;
}

export const createJsonSchemaTransform = ({
  skipList = defaultSkipList,
  schemaRegistry = globalRegistry,
}: CreateJsonSchemaTransformOptions): SwaggerTransform<Schema> => {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: no other way
  return (transformData) => {
    if ('swaggerObject' in transformData) {
      throw new Error(
        'createJsonSchemaTransform - OpenAPI 2.0 is not supported',
      );
    }

    const { schema, url } = transformData;

    if (!schema) {
      return { schema, url };
    }

    const { response, headers, querystring, body, params, hide, ...rest } =
      schema;

    const transformed: {
      response?: Record<string, unknown>;
      hide?: boolean;
      [key: string]: unknown;
    } = {};

    if (skipList.includes(url) || hide) {
      transformed.hide = true;
      return { schema: transformed, url };
    }

    type ZodSchemaRecord = Record<string, $ZodType>;

    const zodSchemas = {
      headers,
      querystring,
      body,
      params,
    } as ZodSchemaRecord;

    const openAPISchemaVersion = getOpenAPISchemaVersion(transformData);

    for (const prop in zodSchemas) {
      const zodSchema = zodSchemas[prop];
      if (zodSchema) {
        transformed[prop] = zodSchemaToJson(
          zodSchema,
          schemaRegistry,
          'input',
          openAPISchemaVersion,
        );
      }
    }

    if (response) {
      transformed.response = {};

      for (const prop in response) {
        const zodSchema = resolveSchema((response as ZodSchemaRecord)[prop]);

        transformed.response[prop] = zodSchemaToJson(
          zodSchema,
          schemaRegistry,
          'output',
          openAPISchemaVersion,
        );
      }
    }

    for (const prop in rest) {
      const meta = rest[prop as keyof typeof rest];
      if (meta) {
        transformed[prop] = meta;
      }
    }

    return { schema: transformed, url };
  };
};

export const jsonSchemaTransform: SwaggerTransform<Schema> =
  createJsonSchemaTransform({});

interface CreateJsonSchemaTransformObjectOptions {
  schemaRegistry?: $ZodRegistry<{ id?: string | undefined }>;
}

export const createJsonSchemaTransformObject = (
  options: CreateJsonSchemaTransformObjectOptions,
): SwaggerTransformObject => {
  const { schemaRegistry = globalRegistry } = options ?? {};

  return (documentObject) => {
    /* v8 ignore next 5 */
    if ('swaggerObject' in documentObject) {
      throw new Error(
        'createJsonSchemaTransformObject - OpenAPI 2.0 is not supported',
      );
    }

    const openAPISchemaVersion = getOpenAPISchemaVersion(documentObject);

    const inputSchemas = zodRegistryToJson(
      schemaRegistry,
      'input',
      openAPISchemaVersion,
    );
    const outputSchemas = zodRegistryToJson(
      schemaRegistry,
      'output',
      openAPISchemaVersion,
    );

    for (const key in outputSchemas) {
      /* v8 ignore next 5 */
      if (inputSchemas[key]) {
        throw new Error(
          `Collision detected for schema "${key}". The is already an input schema with the same name.`,
        );
      }
    }

    return removeUnusedRefs({
      ...documentObject.openapiObject,
      components: {
        ...documentObject.openapiObject.components,
        schemas: {
          ...documentObject.openapiObject.components?.schemas,
          ...inputSchemas,
          ...outputSchemas,
        },
      },
    }) as ReturnType<SwaggerTransformObject>;
  };
};

export const jsonSchemaTransformObject: SwaggerTransformObject =
  createJsonSchemaTransformObject({});

export const validatorCompiler: FastifySchemaCompiler<$ZodType> = ({
  schema: maybeSchema,
}) => {
  return (data) => {
    const schema = resolveSchema(maybeSchema);

    const result = safeParse(schema, data);
    if (result.error) {
      return { error: createValidationError(result.error) as unknown as Error };
    }

    return { value: result.data };
  };
};

function resolveSchema(
  maybeSchema: $ZodType | { properties: $ZodType },
): $ZodType {
  if (maybeSchema instanceof $ZodType) {
    return maybeSchema;
  }

  // I'm not sure about the need of this code.
  // Unit tests are not failing without it so keep it here for reference
  // if (
  //   'properties' in maybeSchema &&
  //   maybeSchema.properties instanceof $ZodType
  // ) {
  //   return maybeSchema.properties;
  // }

  throw new InvalidSchemaError(JSON.stringify(maybeSchema));
}

// biome-ignore-start lint/suspicious/noExplicitAny: Same as json stringify
// #region ZodSerializerCompilerOptions
export interface ZodSerializerCompilerOptions {
  replacer?: (this: any, key: string, value: any) => any;
}
// #endregion ZodSerializerCompilerOptions
// biome-ignore-end lint/suspicious/noExplicitAny: Same as json stringify

type ZodFastifySerializerCompiler = FastifySerializerCompiler<
  $ZodType | { properties: $ZodType }
>;

export const createSerializerCompiler: (
  options?: ZodSerializerCompilerOptions,
) => ZodFastifySerializerCompiler = (options) => {
  return ({ schema: maybeSchema, method, url }) => {
    return (data) => {
      const schema = resolveSchema(maybeSchema);

      const result = safeParse(schema, data);
      if (result.error) {
        throw new ResponseSerializationError(method, url, {
          cause: result.error,
        });
      }

      return JSON.stringify(result.data, options?.replacer);
    };
  };
};

export const serializerCompiler: ZodFastifySerializerCompiler =
  createSerializerCompiler();

/**
 * FastifyPluginCallbackZod with Zod automatic type inference
 *
 * @example
 * ```typescript
 * import { FastifyPluginCallbackZod } from "@marcalexiei/fastify-type-provider-zod"
 *
 * const plugin: FastifyPluginCallbackZod = (fastify, options, done) => {
 *   done()
 * }
 * ```
 */
export type FastifyPluginCallbackZod<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault,
> = FastifyPluginCallback<Options, Server, ZodTypeProvider>;

/**
 * FastifyPluginAsyncZod with Zod automatic type inference
 *
 * @example
 * ```typescript
 * import { FastifyPluginAsyncZod } from "@marcalexiei/fastify-type-provider-zod"
 *
 * const plugin: FastifyPluginAsyncZod = async (fastify, options) => {
 * }
 * ```
 */
export type FastifyPluginAsyncZod<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault,
> = FastifyPluginAsync<Options, Server, ZodTypeProvider>;
