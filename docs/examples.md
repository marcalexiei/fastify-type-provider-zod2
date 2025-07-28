# Examples

## How to use together with @fastify/swagger

This code sets up a Fastify web server with Swagger documentation and Zod-based type validation.
This Fastify server:

- Uses Zod for input validation.
- Automatically generates OpenAPI documentation from Zod schemas.
- Exposes a /login POST endpoint with request body validation.
- Provides Swagger UI at /documentation.

<<< ../examples/swagger.ts

## Customizing error responses

You can customize how Fastify handles request and response validation
errors by extending your global error handler.
Here's how to do it:

<<< ../examples/custom-error.ts

## How to create refs to the schemas?

This plugin automatically generates JSON Schema references via the `jsonSchemaTransformObject` function.
To enable this, you register your schemas in the global Zod registry and assign each one a unique `id`.
Once registered, `fastifySwagger` will generate an OpenAPI document that references these schemas appropriately.

For example, the following code creates a reference to the `User` schema,
ensuring it is included and properly linked in the OpenAPI specification.

<<< ../examples/schema-refs.ts

## How to create a plugin?

The plugin provides types that simplify writing both async and callback-style Fastify plugins,
with full type inference based on your Zod schemas.
This ensures request and response types are automatically inferred,
reducing boilerplate and improving type safety across your routes.

<<< ../examples/plugin.ts
