import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import type { ZodTypeProvider } from '@marcalexiei/fastify-type-provider-zod';
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from '@marcalexiei/fastify-type-provider-zod';
import fastify from 'fastify';
import { z } from 'zod';

const USER_SCHEMA = z.object({
  id: z.number().int().positive(),
  name: z.string().describe('The name of the user'),
});

z.globalRegistry.add(USER_SCHEMA, { id: 'User' });

const app = fastify();
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

app.after(() => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/users',
    schema: {
      response: {
        200: USER_SCHEMA.array(),
      },
    },
    handler: (_req, res) => {
      res.send([]);
    },
  });
});

async function run() {
  await app.ready();

  await app.listen({
    port: 4949,
  });

  app.log.info('Documentation running at http://localhost:4949/documentation');
}

run().catch(() => {});
