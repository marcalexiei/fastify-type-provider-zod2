import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import type {
  ZodOpenApiSchemaMetadata,
  ZodTypeProvider,
} from '../src/index.ts';
import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from '../src/index.ts';

import './_custom-openapi-schema-matchers.ts';

describe('transformer', () => {
  it('generates types for fastify-swagger correctly', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: jsonSchemaTransform,
    });

    await app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    const LOGIN_SCHEMA = z.object({
      username: z.string().max(32).describe('someDescription'),
      seed: z.number().min(1).max(1000),
      code: z.number().lt(10_000).gt(1),
      password: z.string().max(32),
    });

    const UNAUTHORIZED_SCHEMA = z.object({
      required_role: z.literal('admin').nullable(),
      scopes: z.tuple([z.literal('read'), z.literal('write'), z.null()]),
    });

    app
      .withTypeProvider<ZodTypeProvider>()
      .route({
        method: 'POST',
        url: '/login',
        schema: {
          description: 'login route',
          summary: 'login your account',
          consumes: ['application/json'],
          deprecated: false,
          hide: false,
          tags: ['auth'],
          externalDocs: {
            url: 'https://google.com',
            description: 'check google',
          },
          body: LOGIN_SCHEMA,
          response: {
            200: z.string(),
            401: UNAUTHORIZED_SCHEMA,
          },
        },
        handler: (_req, res) => {
          res.send('ok');
        },
      })
      .route({
        method: 'POST',
        url: '/no-schema',
        schema: undefined,
        handler: (_req, res) => {
          res.send('ok');
        },
      })
      .route({
        method: 'DELETE',
        url: '/delete',
        schema: {
          description: 'delete route',
          response: {
            204: z.undefined().describe('Empty response'),
          },
        },
        handler: (_req, res) => {
          res.status(204).send();
        },
      });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  it('generates types for fastify-swagger correctly 3.1', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.register(fastifySwagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: jsonSchemaTransform,
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    const LOGIN_SCHEMA = z.object({
      username: z.string().max(32).describe('someDescription'),
      seed: z.number().min(1),
      password: z.string().max(32),
    });

    const UNAUTHORIZED_SCHEMA = z.object({
      required_role: z.literal('admin'),
    });

    app.after(() => {
      app
        .withTypeProvider<ZodTypeProvider>()
        .route({
          method: 'POST',
          url: '/login',
          schema: {
            description: 'login route',
            summary: 'login your account',
            consumes: ['application/json'],
            deprecated: false,
            hide: false,
            tags: ['auth'],
            externalDocs: {
              url: 'https://google.com',
              description: 'check google',
            },
            body: LOGIN_SCHEMA,
            response: {
              200: z.string(),
              401: UNAUTHORIZED_SCHEMA,
            },
          },
          handler: (_req, res) => {
            res.send('ok');
          },
        })
        .route({
          method: 'POST',
          url: '/no-schema',
          schema: undefined,
          handler: (_req, res) => {
            res.send('ok');
          },
        })
        .route({
          method: 'DELETE',
          url: '/delete',
          schema: {
            description: 'delete route',
            response: {
              204: z.undefined().describe('Empty response'),
            },
          },
          handler: (_req, res) => {
            res.status(204).send();
          },
        });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  it('should fail generating types for fastify-swagger Swagger 2.0 correctly', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.register(fastifySwagger, {
      swagger: {
        swagger: '2.0',
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
      },
      transform: jsonSchemaTransform,
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'DELETE',
        url: '/delete',
        schema: {
          description: 'delete route',
          response: {
            204: z.undefined().describe('Empty response'),
          },
        },
        handler: (_req, res) => {
          res.status(204).send();
        },
      });
    });

    await app.ready();

    expect(() => app.swagger()).toThrowError('OpenAPI 2.0 is not supported');
  });

  it('should not generate ref', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: jsonSchemaTransform,
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    const TOKEN_SCHEMA = z.string().length(12);

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        schema: {
          body: z.object({
            access_token: TOKEN_SCHEMA,
            refresh_token: TOKEN_SCHEMA,
            metadata: z.record(z.string(), z.string()),
            age: z.optional(z.nullable(z.coerce.number())),
          }),
        },
        handler: (_req, res) => {
          res.send('ok');
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    await expect(openApiSpec).toBeValidOpenAPISchema();
    expect(openApiSpec).toMatchSnapshot();
  });

  it('should generate ref correctly using z.registry', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const TOKEN_SCHEMA = z.string().length(12);

    const schemaRegistry = z.registry<{ id: string }>();

    schemaRegistry.add(TOKEN_SCHEMA, {
      id: 'Token',
    });

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: createJsonSchemaTransform({ schemaRegistry }),
      transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        schema: {
          body: z.object({
            access_token: TOKEN_SCHEMA,
            refresh_token: TOKEN_SCHEMA,
          }),
        },
        handler: (_req, res) => {
          res.send('ok');
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    await expect(openApiSpec).toBeValidOpenAPISchema();
    expect(openApiSpec).toMatchSnapshot();
  });

  it('should generate ref correctly using global registry', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const TOKEN_SCHEMA = z.string().length(12).meta({
      id: 'Token',
      description: 'Token description',
    });

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: jsonSchemaTransform,
      transformObject: jsonSchemaTransformObject,
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        schema: {
          body: z.object({
            access_token: TOKEN_SCHEMA,
            refresh_token: TOKEN_SCHEMA,
          }),
        },
        handler: (_req, res) => {
          res.send('ok');
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    z.globalRegistry.remove(TOKEN_SCHEMA);

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  it('should generate nested and circular refs correctly', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const GROUP_SCHEMA = z.object({
      id: z.string(),
      get subgroups() {
        return z.array(GROUP_SCHEMA);
      },
    });

    const USER_SCHEMA = z.object({
      id: z.string(),
      groups: z.array(GROUP_SCHEMA),
    });

    const schemaRegistry = z.registry<{ id: string }>();

    schemaRegistry.add(GROUP_SCHEMA, { id: 'Group' });
    schemaRegistry.add(USER_SCHEMA, { id: 'User' });

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: createJsonSchemaTransform({ schemaRegistry }),
      transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        schema: {
          response: {
            200: z.object({
              groups: z.array(GROUP_SCHEMA),
              user: USER_SCHEMA,
            }),
          },
        },
        handler: (_req, res) => {
          res.send({
            groups: [],
            user: {
              id: '1',
              groups: [],
            },
          });
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  it('should generate input and output schemas correctly', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const schemaRegistry = z.registry<{ id: string }>();

    const ID_SCHEMA = z.string().default('1');

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: createJsonSchemaTransform({ schemaRegistry }),
      transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/',
        schema: {
          querystring: z.object({
            id: ID_SCHEMA,
          }),
          response: {
            200: z.object({
              id: ID_SCHEMA,
            }),
          },
        },
        handler: (_req, res) => {
          res.send({
            id: undefined,
          });
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  it('should generate referenced input and output schemas correctly', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const schemaRegistry = z.registry<{ id: string }>();

    const USER_SCHEMA = z.object({
      id: z.string().default('1'),
      createdAt: z.date(),
    });

    schemaRegistry.add(USER_SCHEMA, {
      id: 'User',
    });

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: createJsonSchemaTransform({ schemaRegistry }),
      transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/',
        schema: {
          body: z.object({
            user: USER_SCHEMA,
          }),
          response: {
            200: z.object({
              user: USER_SCHEMA,
            }),
          },
        },
        handler: (_req, res) => {
          res.send({
            user: {
              id: undefined,
              createdAt: new Date(0),
            },
          });
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  it('should generate referenced input and output schemas correctly when referencing a registered schema', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const schemaRegistry = z.registry<{ id: string }>();

    const USER_SCHEMA = z.object({
      id: z.string().default('1'),
      createdAt: z.date(),
    });

    schemaRegistry.add(USER_SCHEMA, { id: 'User' });

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: createJsonSchemaTransform({ schemaRegistry }),
      transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/',
        schema: {
          body: USER_SCHEMA,
          response: { 200: USER_SCHEMA },
        },
        handler: (_, res) => {
          res.send({
            id: undefined,
            createdAt: new Date(0),
          });
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  it('should not remove securitySchemes from the final openAPI object', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const schemaRegistry = z.registry<{ id: string }>();

    const USER_SCHEMA = z.object({
      id: z.string().default('1'),
      createdAt: z.date(),
    });

    schemaRegistry.add(USER_SCHEMA, { id: 'User' });

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            authorization: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        servers: [],
      },
      transform: createJsonSchemaTransform({ schemaRegistry }),
      transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/',
        schema: {
          body: USER_SCHEMA,
          response: { 200: USER_SCHEMA },
        },
        handler: (_, res) => {
          res.send({
            id: undefined,
            createdAt: new Date(0),
          });
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  it('should not remove schema only referenced from components.schemas from the final openAPI object', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const schemaRegistry = z.registry<{ id: string }>();

    const USER_NAME_SCHEMA = z
      .string()
      .register(schemaRegistry, { id: 'UserName' });

    const USER_SCHEMA = z
      .object({
        id: z.string().default('1'),
        name: USER_NAME_SCHEMA,
      })
      .register(schemaRegistry, { id: 'User' });

    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'SampleApi',
          description: 'Sample backend service',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            authorization: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        servers: [],
      },
      transform: createJsonSchemaTransform({ schemaRegistry }),
      transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
    });

    app.register(fastifySwaggerUI, {
      routePrefix: '/documentation',
    });

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/',
        schema: {
          body: USER_SCHEMA,
          response: { 200: USER_SCHEMA },
        },
        handler: (_, res) => {
          res.send({
            id: undefined,
            name: 'asd',
          });
        },
      });
    });

    await app.ready();

    const openApiSpecResponse = await app.inject().get('/documentation/json');
    const openApiSpec = openApiSpecResponse.json();

    expect(openApiSpec).toMatchSnapshot();
    await expect(openApiSpec).toBeValidOpenAPISchema();
  });

  describe('null type', () => {
    const createNullCaseApp = (): FastifyInstance => {
      const app = Fastify();
      app.setValidatorCompiler(validatorCompiler);
      app.setSerializerCompiler(serializerCompiler);

      app.register(fastifySwagger, {
        openapi: {
          info: {
            title: 'SampleApi',
            description: 'Sample backend service',
            version: '1.0.0',
          },
          servers: [],
        },
        transform: jsonSchemaTransform,
        transformObject: jsonSchemaTransformObject,
      });

      app.register(fastifySwaggerUI, {
        routePrefix: '/documentation',
      });

      return app;
    };

    it('should replace `anyOf` with `"allOf": [...], "nullable": true`  when schema contains only two elements and one is `"type": "null"`', async () => {
      const app = createNullCaseApp();

      const VALUE_SCHEMA = z.union([z.null(), z.array(z.string())]);

      app.after(() => {
        app.withTypeProvider<ZodTypeProvider>().route({
          method: 'POST',
          url: '/',
          schema: {
            response: { 200: VALUE_SCHEMA },
          },
          handler: (_, res) => {
            res.send(null);
          },
        });
      });

      await app.ready();

      const openApiSpecResponse = await app.inject().get('/documentation/json');
      const openApiSpec = openApiSpecResponse.json();

      expect(openApiSpec).toMatchSnapshot();
      await expect(openApiSpec).toBeValidOpenAPISchema();
    });

    it(
      [
        'should replace `anyOf` when it contains 2 elements: `{ anyOf: [<null>, <non-null>]} s`',
        'and one of them is `"type": "null" with `{...<non-null>, nullable: true }`',
      ].join(' '),
      async () => {
        const app = createNullCaseApp();

        const VALUE_SCHEMA = z.union([
          z.null(),
          z.array(z.string()),
          z.literal('any'),
        ]);

        app.after(() => {
          app.withTypeProvider<ZodTypeProvider>().route({
            method: 'POST',
            url: '/',
            schema: {
              response: { 200: VALUE_SCHEMA },
            },
            handler: (_, res) => {
              res.send(null);
            },
          });
        });

        await app.ready();

        const openApiSpecResponse = await app
          .inject()
          .get('/documentation/json');
        const openApiSpec = openApiSpecResponse.json();

        expect(openApiSpec).toMatchSnapshot();
        await expect(openApiSpec).toBeValidOpenAPISchema();
      },
    );
  });

  describe('description and examples fields with custom schema registry', () => {
    const schemaRegistry = z.registry<ZodOpenApiSchemaMetadata>();

    const UserIdSchema = z
      .string()
      .optional()
      .default('J1')
      .register(schemaRegistry, {
        id: 'UserId',
        description: 'User ID',
        example: 'U234',
      });

    const UserSchema = z
      .strictObject({ name: z.string().optional().default('Unknown') })
      .register(schemaRegistry, {
        id: 'User',
        description: 'User',
        example: { name: 'Someone' },
      });

    it('should populate description and examples 3.0', async () => {
      const app = Fastify();
      app.setValidatorCompiler(validatorCompiler);
      app.setSerializerCompiler(serializerCompiler);

      await app.register(fastifySwagger, {
        openapi: {
          openapi: '3.1.0',
          info: {
            title: 'SampleApi',
            version: '1.0.1',
          },
          servers: [],
        },
        transform: createJsonSchemaTransform({ schemaRegistry }),
        transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
      });

      await app.register(fastifySwaggerUI, {
        routePrefix: '/documentation',
      });

      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        schema: {
          querystring: z.object({
            baz: z.string().meta({
              description: 'query string example',
              example: 'wiiiiiiiiii',
            }),
          }),
          body: z.object({
            userId: UserIdSchema,
          }),
          response: {
            200: z.object({
              baz: z.string(),
              userId: UserIdSchema,
              user: UserSchema,
            }),
          },
        },
        handler: (_, res) => {
          res.send({} as never);
        },
      });

      const openApiSpecResponse = await app.inject().get('/documentation/json');
      const openApiSpec = openApiSpecResponse.json();

      expect(openApiSpec).toMatchSnapshot();
      await expect(openApiSpec).toBeValidOpenAPISchema();
    });

    it('should populate description and examples 3.1', async () => {
      const app = Fastify();
      app.setValidatorCompiler(validatorCompiler);
      app.setSerializerCompiler(serializerCompiler);

      await app.register(fastifySwagger, {
        openapi: {
          openapi: '3.1.0',
          info: {
            title: 'SampleApi',
            version: '1.0.1',
          },
          servers: [],
        },
        transform: createJsonSchemaTransform({ schemaRegistry }),
        transformObject: createJsonSchemaTransformObject({ schemaRegistry }),
      });

      await app.register(fastifySwaggerUI, {
        routePrefix: '/documentation',
      });

      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        schema: {
          querystring: z.object({
            baz: z.string().meta({
              description: 'query string example',
              example: 'wiiiiiiiiii',
            }),
          }),
          body: z.object({
            userId: UserIdSchema,
          }),
          response: {
            200: z.object({
              baz: z.string(),
              userId: UserIdSchema,
              user: UserSchema,
            }),
          },
        },
        handler: (_, res) => {
          res.send({} as never);
        },
      });

      const openApiSpecResponse = await app.inject().get('/documentation/json');
      const openApiSpec = openApiSpecResponse.json();

      expect(openApiSpec).toMatchSnapshot();
      await expect(openApiSpec).toBeValidOpenAPISchema();
    });
  });
});
