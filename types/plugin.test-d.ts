import type { Http2Server } from 'node:http2';
import type { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { assertType, describe, it } from 'vitest';
import z from 'zod/v4';
import type {
  FastifyPluginAsyncZod,
  FastifyPluginCallbackZod,
} from '../src/index';

describe('plugin', () => {
  it('ensure the defaults of FastifyPluginAsyncZod are the same as FastifyPluginAsync', () => {
    assertType<FastifyPluginAsync>(async (fastify, options) => {
      const pluginAsyncZodDefaults: FastifyPluginAsyncZod = async (
        fastifyWithZod,
        optionsZod,
      ) => {
        assertType<(typeof fastifyWithZod)['server']>(fastify.server);
        assertType<typeof optionsZod>(options);
      };
      fastify.register(pluginAsyncZodDefaults);
    });
  });

  it('Ensure the defaults of FastifyPluginAsyncZod are the same as FastifyPluginCallback', () => {
    assertType<FastifyPluginCallback>(async (fastify, options) => {
      const pluginCallbackZodDefaults: FastifyPluginAsyncZod = async (
        fastifyWithZod,
        optionsZod,
      ) => {
        assertType<(typeof fastifyWithZod)['server']>(fastify.server);
        assertType<typeof optionsZod>(options);
      };

      fastify.register(pluginCallbackZodDefaults);
    });
  });

  it('FastifyPluginAsyncZod should provide correct types when providing generics', () => {
    const fastify = Fastify();
    const asyncPlugin: FastifyPluginAsyncZod<
      { optionA: string },
      Http2Server
    > = async (fastify, options) => {
      assertType<Http2Server>(fastify.server);

      assertType<string>(options.optionA);

      fastify.get(
        '/',
        {
          schema: {
            body: z.object({
              x: z.string(),
              y: z.number(),
              z: z.boolean(),
            }),
          },
        },
        (req) => {
          assertType<boolean>(req.body.z);
          assertType<number>(req.body.y);
          assertType<string>(req.body.x);
        },
      );
    };
    fastify.register(asyncPlugin, { optionA: 'test' });
    fp(asyncPlugin);
  });

  it('FastifyPluginCallbackZod should provide correct types when providing generics', () => {
    const fastify = Fastify();

    const callbackPlugin: FastifyPluginCallbackZod<
      { optionA: string },
      Http2Server
    > = (fastify, options, done) => {
      assertType<Http2Server>(fastify.server);

      assertType<string>(options.optionA);

      fastify.get(
        '/',
        {
          schema: {
            body: z.object({
              x: z.string(),
              y: z.number(),
              z: z.boolean(),
            }),
          },
        },
        (req) => {
          assertType<boolean>(req.body.z);
          assertType<number>(req.body.y);
          assertType<string>(req.body.x);
        },
      );
      done();
    };

    fastify.register(callbackPlugin, { optionA: 'test' });

    fp(callbackPlugin);
  });

  it('FastifyPluginAsyncZod should provide correct types when using default http server', () => {
    const asyncPluginHttpDefault: FastifyPluginAsyncZod<{
      optionA: string;
    }> = async (fastify, options) => {
      assertType<(typeof fastify)['server']>(fastify.server);
      assertType<typeof options>(options);
      assertType<{ optionA: string }>(options);
    };

    fp(asyncPluginHttpDefault);
  });
});
