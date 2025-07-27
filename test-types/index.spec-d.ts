import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify';
import Fastify from 'fastify';
import { assertType, describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod/v4';
import type { ZodTypeProvider } from '../src/index.ts';
import { serializerCompiler, validatorCompiler } from '../src/index.ts';

describe('index', () => {
  it('FastifyZodInstance is compatible with FastifyInstance', () => {
    const fastify = Fastify().withTypeProvider<ZodTypeProvider>();

    type FastifyZodInstance = FastifyInstance<
      RawServerDefault,
      RawRequestDefaultExpression,
      RawReplyDefaultExpression,
      FastifyBaseLogger,
      ZodTypeProvider
    >;

    assertType<FastifyZodInstance>(
      fastify.setValidatorCompiler(validatorCompiler),
    );
    assertType<FastifyZodInstance>(
      fastify.setSerializerCompiler(serializerCompiler),
    );

    expectTypeOf(fastify).toExtend<FastifyInstance>();
    expectTypeOf(fastify).toExtend<FastifyZodInstance>();
  });

  it('should infer route types from zod schema', () => {
    const fastify = Fastify().withTypeProvider<ZodTypeProvider>();

    fastify.route({
      method: 'GET',
      url: '/',
      // Define your schema
      schema: {
        querystring: z.object({
          name: z.string().min(4),
        }),
        response: {
          200: z.string(),
        },
      },
      handler: (req, res) => {
        expectTypeOf(req.query.name).toBeString();
        res.send('string');
      },
    });
  });
});
