# Setup

This example demonstrates how to configure Fastify to use Zod schemas
to validate incoming queries and serialize responses, powered by fastify‑type‑provider‑zod.

You’ll see how to:

- Enable runtime validation of querystring and ensure responses comply with declared Zod types.
- Infer full TypeScript types for request and response data via `.withTypeProvider<ZodTypeProvider>()`.
- Seamlessly integrate validatorCompiler and serializerCompiler from the plugin for unified schema enforcement

This setup keeps your route definitions clean and type-safe,
using a single source of truth for schema, validation, and typing.

<<< ../examples/setup.ts

## Customize serializer

::: info

You can also pass options to the `serializerCompiler` function:

:::

<<< ../src/core.ts#ZodSerializerCompilerOptions

<<< ../examples/setup-serializer.ts
