import type { $ZodDate, $ZodUndefined, JSONSchema } from 'zod/v4/core';
import { $ZodRegistry, $ZodType, toJSONSchema } from 'zod/v4/core';
import {
  convertSchemaToOpenAPISchemaVersion,
  type OpenAPISchemaVersion,
} from './openapi.ts';

const getSchemaId = (id: string, io: 'input' | 'output') => {
  return io === 'input' ? `${id}Input` : id;
};

const getReferenceUri = (id: string, io: 'input' | 'output') => {
  return `#/components/schemas/${getSchemaId(id, io)}`;
};

function isZodDate(entity: unknown): entity is $ZodDate {
  return entity instanceof $ZodType && entity._zod.def.type === 'date';
}

function isZodUndefined(entity: unknown): entity is $ZodUndefined {
  return entity instanceof $ZodType && entity._zod.def.type === 'undefined';
}

const getOverride = (
  ctx: {
    zodSchema: $ZodType;
    jsonSchema: JSONSchema.BaseSchema;
  },
  io: 'input' | 'output',
  registry: $ZodRegistry,
) => {
  // Extract metadata from the specified registry.
  // The `.meta()` method adds the element to the global registry.
  // Note: If a custom registry is used, any properties registered via `.meta()`
  // will be lost when `.register()` is called.
  let meta = registry.get(ctx.zodSchema) as Record<string, unknown>;

  // You can still inlining metadata in the schema that are not included
  // in the registry, 
  // e.g., a query param
  if (!meta) {
    // @ts-expect-error
    const schemaMeta = ctx.zodSchema.meta() as Record<string, unknown>;
    if (schemaMeta) {
      meta = schemaMeta;
    }
  }

  if (meta) {
    if (typeof meta.description === 'string') {
      ctx.jsonSchema.description = meta.description;
    }
    if (meta.example) {
      ctx.jsonSchema.example = meta.example;
    }
  }

  if (io === 'input') {
    return;
  }

  // Allow dates to be represented as strings in output schemas
  if (isZodDate(ctx.zodSchema)) {
    ctx.jsonSchema.type = 'string';
    ctx.jsonSchema.format = 'date-time';
  }

  if (isZodUndefined(ctx.zodSchema)) {
    ctx.jsonSchema.type = 'null';
  }
};

const zodJSONSchemaTarget = 'draft-2020-12' as const;

export const zodSchemaToJson: (
  zodSchema: $ZodType,
  registry: $ZodRegistry<{ id?: string }>,
  io: 'input' | 'output',
  openAPISchemaVersion: OpenAPISchemaVersion,
) => JSONSchema.BaseSchema = (
  zodSchema,
  registry,
  io,
  openAPISchemaVersion,
) => {
  const schemaRegistryEntry = registry.get(zodSchema);

  /**
   * Checks whether the provided schema is registered in the given registry.
   * If it is present and has an `id`, it can be referenced as component.
   *
   * @see https://github.com/turkerdev/fastify-type-provider-zod/issues/173
   */
  if (schemaRegistryEntry?.id) {
    return { $ref: getReferenceUri(schemaRegistryEntry.id, io) };
  }

  /**
   * Unfortunately, at the time of writing, there is no way to generate a schema with `$ref`
   * using `toJSONSchema` and a zod schema.
   *
   * As a workaround, we create a zod registry containing only the specific schema we want to convert.
   *
   * @see https://github.com/colinhacks/zod/issues/4281
   */
  const tempID = 'GEN';
  const tempRegistry = new $ZodRegistry<{ id: string }>();
  tempRegistry.add(zodSchema, { id: tempID });

  const {
    schemas: { [tempID]: result },
  } = toJSONSchema(tempRegistry, {
    target: zodJSONSchemaTarget,
    metadata: registry,
    io,
    unrepresentable: 'any',
    cycles: 'ref',
    reused: 'inline',

    /**
     * The uri option only allows customizing the base path of the `$ref`, and it automatically appends a path to it.
     * As a workaround, we set a placeholder that looks something like this:
     *
     * |       marker          | always added by zod | meta.id |
     * |__SCHEMA__PLACEHOLDER__|      #/$defs/       | User    |
     *
     * @example `__SCHEMA__PLACEHOLDER__#/$defs/User"`
     * @example `__SCHEMA__PLACEHOLDER__#/$defs/Group"`
     *
     * @see jsonSchemaReplaceRef
     * @see https://github.com/colinhacks/zod/issues/4750
     */
    uri: () => '__SCHEMA__PLACEHOLDER__',

    override: (ctx) => getOverride(ctx, io, registry),
  });

  /**
   * Replace the previous generated placeholders with the final `$ref` value
   */
  const jsonSchemaReplaceRef = JSON.stringify(result).replaceAll(
    /"__SCHEMA__PLACEHOLDER__#\/\$defs\/(.+?)"/g,
    (_, id) => `"${getReferenceUri(id, io)}"`,
  );

  const jsonSchemaWithRef = JSON.parse(jsonSchemaReplaceRef);

  return convertSchemaToOpenAPISchemaVersion(jsonSchemaWithRef, {
    openAPISchemaVersion,
  });
};

export const zodRegistryToJson: (
  registry: $ZodRegistry<{ id?: string }>,
  io: 'input' | 'output',
  openAPISchemaVersion: OpenAPISchemaVersion,
) => Record<string, JSONSchema.BaseSchema> = (
  registry,
  io,
  openAPISchemaVersion,
) => {
  const result = toJSONSchema(registry, {
    target: zodJSONSchemaTarget,
    io,
    unrepresentable: 'any',
    cycles: 'ref',
    reused: 'inline',
    uri: (id) => getReferenceUri(id, io),
    override: (ctx) => getOverride(ctx, io, registry),
  }).schemas;

  const jsonSchemas: Record<string, JSONSchema.BaseSchema> = {};

  for (const id in result) {
    jsonSchemas[getSchemaId(id, io)] = convertSchemaToOpenAPISchemaVersion(
      result[id],
      { openAPISchemaVersion },
    );
  }

  return jsonSchemas;
};

const refPropertyValueMatch = /^#\/components\//;

function collectRefs(obj: unknown, refs = new Set<string>()): Set<string> {
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (key === '$ref' && typeof value === 'string') {
        refs.add(value.replace(refPropertyValueMatch, ''));
      } else {
        collectRefs(value, refs);
      }
    }
  }
  return refs;
}

export function removeUnusedRefs(
  spec: JSONSchema.BaseSchema,
): JSONSchema.BaseSchema {
  const usedRefs = collectRefs(spec.paths);
  const components = spec.components as Record<string, unknown>;

  /* c8 ignore next 3, usually open api schema has components schema set as empty object */
  if (!components) {
    return spec;
  }

  for (const section of Object.keys(components)) {
    const items = components[section] as Record<string, unknown>;
    if (!items) {
      continue;
    }

    for (const key of Object.keys(items)) {
      if (![...usedRefs].some((r) => r.startsWith(`${section}/${key}`))) {
        delete items[key];
      }
    }
  }

  return spec;
}
