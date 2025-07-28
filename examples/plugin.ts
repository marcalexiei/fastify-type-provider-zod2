import type { FastifyPluginAsyncZod } from '@marcalexiei/fastify-type-provider-zod';
import { z } from 'zod';

export const plugin: FastifyPluginAsyncZod = async (fastify, _opts) => {
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
      res.send(req.query.name);
    },
  });

  await Promise.resolve();
};
