import type { Http2Server } from 'node:http2';
import type { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';
import fastify from 'fastify';
import fp from 'fastify-plugin';
import { assertType, describe, it } from 'vitest';
import z from 'zod/v4';
import type {
  FastifyPluginAsyncZod,
  FastifyPluginCallbackZod,
} from '../src/index.ts';

describe('plugin', () => {
  it('ensure the defaults of FastifyPluginAsyncZod are the same as FastifyPluginAsync', () => {
    assertType<FastifyPluginAsync>(async (_fastify, options) => {
      const pluginAsyncZodDefaults: FastifyPluginAsyncZod = async (
        fastifyWithZod,
        optionsZod,
      ) => {
        assertType<(typeof fastifyWithZod)['server']>(_fastify.server);
        assertType<typeof optionsZod>(options);
      };
      _fastify.register(pluginAsyncZodDefaults);
    });
  });

  it('Ensure the defaults of FastifyPluginAsyncZod are the same as FastifyPluginCallback', () => {
    assertType<FastifyPluginCallback>(async (_fastify, options) => {
      const pluginCallbackZodDefaults: FastifyPluginAsyncZod = async (
        fastifyWithZod,
        optionsZod,
      ) => {
        assertType<(typeof fastifyWithZod)['server']>(_fastify.server);
        assertType<typeof optionsZod>(options);
      };

      _fastify.register(pluginCallbackZodDefaults);
    });
  });

  it('FastifyPluginAsyncZod should provide correct types when providing generics', () => {
    const app = fastify();
    const asyncPlugin: FastifyPluginAsyncZod<
      { optionA: string },
      Http2Server
    > = async (_fastify, options) => {
      assertType<Http2Server>(_fastify.server);

      assertType<string>(options.optionA);

      _fastify.get(
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
    app.register(asyncPlugin, { optionA: 'test' });
    fp(asyncPlugin);
  });

  it('FastifyPluginCallbackZod should provide correct types when providing generics', () => {
    const app = fastify();

    const callbackPlugin: FastifyPluginCallbackZod<
      { optionA: string },
      Http2Server
    > = (_fastify, options, done) => {
      assertType<Http2Server>(_fastify.server);

      assertType<string>(options.optionA);

      _fastify.get(
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

    app.register(callbackPlugin, { optionA: 'test' });

    fp(callbackPlugin);
  });

  it('FastifyPluginAsyncZod should provide correct types when using default http server', () => {
    const asyncPluginHttpDefault: FastifyPluginAsyncZod<{
      optionA: string;
    }> = async (_fastify, options) => {
      assertType<(typeof _fastify)['server']>(_fastify.server);
      assertType<typeof options>(options);
      assertType<{ optionA: string }>(options);
    };

    fp(asyncPluginHttpDefault);
  });
});
