import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import type { ZodTypeProvider } from '../src/index';
import { serializerCompiler, validatorCompiler } from '../src/index';

describe('response schema', () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    const REQUEST_SCHEMA = z.object({
      name: z.string(),
    });

    app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.after(() => {
      app
        .withTypeProvider<ZodTypeProvider>()
        .route({
          method: 'POST',
          url: '/',
          schema: {
            body: REQUEST_SCHEMA,
          },
          handler: (req, res) => {
            res.send({
              name: req.body.name,
            });
          },
        })
        .route({
          method: 'GET',
          url: '/',
          schema: {
            querystring: REQUEST_SCHEMA,
          },
          handler: (req, res) => {
            res.send({
              name: req.query.name,
            });
          },
        })
        .route({
          method: 'GET',
          url: '/no-schema',
          schema: undefined,
          handler: (_req, res) => {
            res.send({
              status: 'ok',
            });
          },
        });
    });

    await app.ready();

    return async () => {
      await app.close();
    };
  });

  it('accepts correct request', async () => {
    const response = await app.inject().get('/').query({
      name: 'test',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      name: 'test',
    });
  });

  it('accepts request on route without schema', async () => {
    const response = await app.inject().get('/no-schema');

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
    });
  });

  it('returns 400 on querystring validation error', async () => {
    const response = await app.inject().get('/');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "code": "FST_ERR_VALIDATION",
        "error": "Bad Request",
        "message": "querystring/name Invalid input: expected string, received undefined",
        "statusCode": 400,
      }
    `);
  });

  it('returns 400 on body validation error', async () => {
    const response = await app.inject().post('/').body({
      surname: 'dummy',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "code": "FST_ERR_VALIDATION",
        "error": "Bad Request",
        "message": "body/name Invalid input: expected string, received undefined",
        "statusCode": 400,
      }
    `);
  });

  it('returns 400 on empty body validation error', async () => {
    const response = await app.inject().post('/');

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchInlineSnapshot(`
      {
        "code": "FST_ERR_VALIDATION",
        "error": "Bad Request",
        "message": "body/ Invalid input: expected object, received null",
        "statusCode": 400,
      }
    `);
  });
});

describe('should return a FST_ERR_INVALID_SCHEMA error when a non-zod schema is provided', () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.after(() => {
      app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/invalid',
        schema: {
          querystring: { notZod: true },
        },
        handler: (_, res) => {
          res.send({ test: 's' });
        },
      });
    });

    await app.ready();

    return async () => {
      await app.close();
    };
  });

  it('works', async () => {
    const res = await app.inject().get('/invalid');

    expect(res.statusCode).toBe(500);
    expect(res.json()).toMatchInlineSnapshot(`
        {
          "code": "FST_ERR_INVALID_SCHEMA",
          "error": "Internal Server Error",
          "message": "Invalid schema passed: {"notZod":true}",
          "statusCode": 500,
        }
      `);
  });
});
